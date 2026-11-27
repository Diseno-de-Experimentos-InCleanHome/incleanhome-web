import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { TrackingEventName as E, allowedProperties } from "../src/Tracking/domain/model/tracking-plan.js";
import { sanitizeProperties } from "../src/Tracking/domain/services/tracking-privacy.js";
import { errorTypeOf } from "../src/Tracking/domain/services/error-type.js";
import { newId, userRefFor } from "../src/Tracking/domain/model/tracking-event.entity.js";
import {
  EventTracker, TrackResult, FLUSH_DELAY_MS, RETRY_DELAYS_MS, MAX_OUTBOX,
} from "../src/Tracking/application/event-tracker.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";

const httpError = (status) => ({ response: { status } });
const client = { id: 33, role: "Client" };

function tracker({ token = "token", send = vi.fn().mockResolvedValue() } = {}) {
  const session = { token };
  const instance = new EventTracker({
    storage: TrackingStorage,
    api: { sendEvents: send },
    getToken: () => session.token,
    environment: "test",
  });
  return { instance, send, session };
}

const faq = (instance, extra = {}) => instance.record({
  eventName: E.FAQ_VIEWED,
  properties: { category: "bookings", faqId: "bookings-cancel" },
  user: client,
  ...extra,
});

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("US42 - Catálogo y privacidad", () => {
  it("testPlan_IncluyeLasPropiedadesDelInforme", () => {
    const required = {
      worker_search_performed: ["serviceCategory", "filtersApplied", "resultsCount"],
      worker_profile_viewed: ["workerId", "platform"],
      worker_reviews_viewed: ["workerId", "reviewCount"],
      availability_updated: ["workerId", "updatedDaysCount"],
      booking_form_opened: ["workerId", "platform"],
      booking_request_created: ["bookingId", "serviceCategory", "status"],
      booking_request_failed: ["errorType", "platform"],
      booking_status_changed: ["bookingId", "previousStatus", "newStatus"],
      message_sent: ["conversationId", "userRole"],
      review_submitted: ["bookingId", "rating"],
      faq_viewed: ["category", "faqId"],
      faq_resolved: ["category", "faqId"],
      booking_estimate_viewed: ["formId", "estimatedAmount"],
      experiment_exposure: ["location"],
    };

    for (const [event, properties] of Object.entries(required)) {
      expect(allowedProperties(event), event).toEqual(expect.arrayContaining(properties));
    }
    expect(Object.values(E).sort()).toEqual(Object.keys(required).sort());
  });

  // US42 - Escenario 3: no registra contraseñas, tokens, direcciones ni mensajes
  it("testPrivacidad_FiltraDatosSensibles", () => {
    const result = sanitizeProperties(E.BOOKING_FORM_OPENED, {
      formId: "form-1",
      workerId: 3,
      address: "Av. Siempre Viva 123",
      password: "secret",
      token: "eyJhbGciOi.eyJzdWIiOi.c2lnbmF0dXJl",
      comment: "texto libre",
      origin: "cliente@correo.com",
      searchId: "aaa.bbb.ccc",
    });

    expect(result).toEqual({ formId: "form-1", workerId: 3 });
  });

  it("testPrivacidad_ElDistritoNoPuedeSerUnaDireccion", () => {
    const district = (value) => sanitizeProperties(E.WORKER_SEARCH_PERFORMED, { district: value }).district;

    expect(district("Av. Arequipa 123")).toBeUndefined();
    expect(district("Calle Los Pinos")).toBeUndefined();
    expect(district("san_isidro")).toBe("san_isidro");
    expect(district("Jesús María")).toBe("Jesús María");
  });

  it("testPrivacidad_SoloElServidorPuedeMarcarCapturaDeServidor", () => {
    const captured = (value) => sanitizeProperties(E.REVIEW_SUBMITTED, { capturedBy: value });

    expect(captured("client")).toEqual({ capturedBy: "client" });
    expect(captured("server")).toEqual({});
  });

  it("testPrivacidad_DescartaTiposNoEsperados", () => {
    expect(sanitizeProperties(E.BOOKING_REQUEST_CREATED, {
      bookingId: "7", registeredAmount: Number.NaN, amountMatches: "true", status: "Av 1",
    })).toEqual({});
  });

  it("testErrorType_MismosCodigosQueLaApp", () => {
    expect(errorTypeOf(httpError(400))).toBe("http_400");
    expect(errorTypeOf({ request: {} })).toBe("network");
    expect(errorTypeOf(new Error("x"))).toBe("unexpected");
  });

  it("testUserRef_IgualALaAppMovil", () => {
    const expected = createHash("sha256").update("incleanhome-user:33").digest("hex").slice(0, 16);

    expect(userRefFor(33, "s")).toBe(expected);
    expect(userRefFor(null, "s")).toBe("anonymous:s");
  });

  it("testNewId_EsUnUuidV4Distinto", () => {
    const ids = new Set(Array.from({ length: 50 }, newId));

    expect(ids.size).toBe(50);
    expect([...ids][0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("US42 - Registro de eventos", () => {
  // US42 - Escenario 1: propiedades comunes
  it("testTracker_EventoConPropiedadesComunes", () => {
    vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
    const { instance } = tracker();

    expect(faq(instance)).toBe(TrackResult.RECORDED);

    const [event] = TrackingStorage.getOutbox();
    expect(event).toMatchObject({
      eventName: "faq_viewed",
      occurredAt: "2026-11-25T15:00:00.000Z",
      platform: "web",
      environment: "test",
      userRole: "client",
      userRef: userRefFor(33),
      experimentId: null,
      variant: null,
      featureActive: null,
      properties: { category: "bookings", faqId: "bookings-cancel" },
    });
    expect(event.eventId).toBeTruthy();
    expect(event.sessionId).toBe(instance.sessionId);
  });

  it("testTracker_IncluyeExperimentoSoloSiParticipa", () => {
    const { instance } = tracker();
    const base = { experimentId: "EC-BLQ06", variant: "control", featureActive: false };

    faq(instance, { assignment: { ...base, inExperiment: true } });
    faq(instance, { assignment: { ...base, inExperiment: false } });

    const [inside, outside] = TrackingStorage.getOutbox();
    expect(inside).toMatchObject(base);
    expect(outside).toMatchObject({ experimentId: null, variant: null, featureActive: null });
  });

  it("testTracker_RechazaEventoFueraDelPlan", () => {
    const { instance } = tracker();

    expect(instance.record({ eventName: "password_changed" })).toBe(TrackResult.REJECTED);
    expect(TrackingStorage.getOutbox()).toEqual([]);
  });

  // US42 - Escenario 4: la misma operación no se duplica
  it("testTracker_NoDuplicaOperacionYConservaElEventId", () => {
    const first = tracker().instance;
    expect(faq(first, { operationKey: "visita-1" })).toBe(TrackResult.RECORDED);
    expect(faq(first, { operationKey: "visita-1" })).toBe(TrackResult.DUPLICATE);
    const [{ eventId }] = TrackingStorage.getOutbox();

    // Tras perder el registro de claves, el mismo hecho conserva su identificador
    localStorage.clear();
    faq(tracker().instance, { operationKey: "visita-1" });

    expect(TrackingStorage.getOutbox()[0].eventId).toBe(eventId);
  });

  it("testTracker_LimitaLaCola", () => {
    const { instance } = tracker({ token: null });

    for (let i = 0; i < MAX_OUTBOX + 5; i++) faq(instance);

    expect(TrackingStorage.getOutbox()).toHaveLength(MAX_OUTBOX);
  });
});

describe("US42 - Envío y reintentos", () => {
  it("testEnvio_AgrupaYVaciaLaCola", async () => {
    const { instance, send } = tracker();
    faq(instance);
    faq(instance);

    await vi.advanceTimersByTimeAsync(FLUSH_DELAY_MS);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toHaveLength(2);
    expect(TrackingStorage.getOutbox()).toEqual([]);
  });

  it("testEnvio_EnLotesDe100", async () => {
    const { instance, send, session } = tracker({ token: null });
    for (let i = 0; i < 230; i++) faq(instance);
    session.token = "token";

    await expect(instance.flush()).resolves.toBe(230);

    expect(send.mock.calls.map(([batch]) => batch.length)).toEqual([100, 100, 30]);
  });

  it("testEnvio_SinSesionNoEnvia", async () => {
    const { instance, send } = tracker({ token: null });
    faq(instance);

    await instance.flush();

    expect(send).not.toHaveBeenCalled();
    expect(TrackingStorage.getOutbox()).toHaveLength(1);
  });

  it.each([503, 500, undefined])("testEnvio_ConservaYReintenta con error %s", async (status) => {
    const send = vi.fn().mockRejectedValueOnce(status ? httpError(status) : { request: {} }).mockResolvedValue();
    const { instance } = tracker({ send });
    faq(instance);

    await instance.flush();
    expect(TrackingStorage.getOutbox()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0][0].eventId).toBe(send.mock.calls[0][0][0].eventId);
    expect(TrackingStorage.getOutbox()).toEqual([]);
  });

  it("testEnvio_LaEsperaCreceYNoSeAdelanta", async () => {
    const send = vi.fn().mockRejectedValue(httpError(503));
    const { instance } = tracker({ send });
    faq(instance);
    await instance.flush();

    faq(instance); // un evento nuevo no adelanta el reintento
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);
    expect(send).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[1] - 1);
    expect(send).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("testEnvio_401ConservaYEsperaUnaSesionNueva", async () => {
    const send = vi.fn().mockRejectedValueOnce(httpError(401)).mockResolvedValue();
    const { instance } = tracker({ send });
    faq(instance);

    await instance.flush();
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS.at(-1) * 2);
    expect(send).toHaveBeenCalledTimes(1);
    expect(TrackingStorage.getOutbox()).toHaveLength(1);

    await instance.flush();
    expect(TrackingStorage.getOutbox()).toEqual([]);
  });

  it("testEnvio_400DescartaElLoteParaNoBloquearLaCola", async () => {
    const send = vi.fn().mockRejectedValue(httpError(400));
    const { instance } = tracker({ send });
    faq(instance);

    await expect(instance.flush()).resolves.toBe(0);

    expect(send).toHaveBeenCalledTimes(1);
    expect(TrackingStorage.getOutbox()).toEqual([]);
  });
});
