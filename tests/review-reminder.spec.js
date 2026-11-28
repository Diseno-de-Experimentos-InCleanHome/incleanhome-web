/**
 * US35 — recordatorio para calificar: enlace del correo y origen de la reseña.
 * El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, enableAutoUnmount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { path: "/client/bookings", params: {}, query: {} };
const push = vi.fn();
const replace = vi.fn();
// Las pantallas usan la ruta simulada; las pruebas de rutas, el enrutador real.
vi.mock("vue-router", async (original) => ({
  ...(await original()), useRoute: () => route, useRouter: () => ({ push, replace }),
}));

const get = vi.fn();
const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { useExperimentStore } from "../src/Experiments/application/experiment.store.js";
import { useToastStore } from "../src/Shared/application/toast.store.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import { rememberReturnPath, takeReturnPath } from "../src/IAM/application/return-path.js";
import ClientBookingsView from "../src/Booking/presentation/views/ClientBookingsView.vue";
import TwoFactorVerifyView from "../src/IAM/presentation/views/TwoFactorVerifyView.vue";

const booking = (id, extra) => ({
  id, workerId: 3, workerName: `Prestador ${id}`, serviceType: "limpieza_general", date: "2026-11-25",
  startTime: "08:00", endTime: "10:00", address: "Av. Larco 123", totalAmount: 40, status: "completed",
  hasReview: false, createdAt: "2026-11-20T10:00:00Z", ...extra,
});
const bookings = [booking(6), booking(7), booking(8, { hasReview: true }), booking(9, { status: "accepted" })];
const experiment = (percent, isEnabled = true) =>
  ({ experiments: [{ id: "EC-BLQ03", enabled: isEnabled, treatmentPercent: percent }] });
const fromEmail = { reviewBookingId: "7", source: "reminder" };

let config;
const events = (name) => TrackingStorage.getOutbox().filter((e) => e.eventName === name);
const reviews = () => post.mock.calls.filter(([url]) => url === "/reviews").map(([, body]) => body);
const modal = (wrapper) => wrapper.find(".modal-box");

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  useAuthStore().updateUser({ id: 1, role: "client" });
  i18n.global.locale.value = "es";
  route.query = { ...fromEmail };
  config = experiment(100);
  get.mockImplementation(async (url) => ({ data: url === "/experiments/config" ? config : bookings }));
  post.mockResolvedValue({ data: { id: 1, rating: 5, isVerified: true } });
});
enableAutoUnmount(afterEach);

async function mountView() {
  await useExperimentStore().load(); // en la app lo pide main.js al iniciar
  const wrapper = mount(ClientBookingsView, { global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: true } } });
  await flushPromises();
  return wrapper;
}

async function rate(wrapper) {
  await wrapper.findAll(".rating-btn")[4].trigger("click");
  await wrapper.find("textarea").setValue("Muy bien");
  await wrapper.find(".modal-actions .btn-primary").trigger("click");
  await flushPromises();
}

describe("US35 - Enlace del recordatorio", () => {
  // Escenario 1
  it("testEnlace_AbreLaResenaDeEsaReserva", async () => {
    const wrapper = await mountView();

    expect(modal(wrapper).text()).toContain("Prestador 7");
    expect(replace).not.toHaveBeenCalled();
  });

  // Escenario 4
  it("testResena_DesdeElCorreoDeclaraElRecordatorio", async () => {
    const wrapper = await mountView();

    await rate(wrapper);

    expect(reviews()).toEqual([{ bookingId: 7, workerId: 3, rating: 5, comment: "Muy bien", source: "reminder" }]);
    const [submitted] = events("review_submitted");
    expect(submitted).toMatchObject({ experimentId: "EC-BLQ03", variant: "treatment", featureActive: true });
    expect(submitted.properties).toMatchObject({ bookingId: 7, rating: 5, source: "reminder" });
    expect(modal(wrapper).exists()).toBe(false);
    expect(replace).toHaveBeenCalledWith({ path: "/client/bookings", query: {} });
  });

  it.each([[undefined], ["otro"], [["reminder", "reminder"]]])(
    "testOrigen_%s en el enlace se declara directo", async (source) => {
      route.query = { reviewBookingId: "7", source };
      const wrapper = await mountView();

      await rate(wrapper);

      expect(reviews()[0].source).toBe("direct");
      expect(events("review_submitted")[0].properties.source).toBe("direct");
    });

  it("testSinEnlace_NoAbreNadaYElBotonDeclaraDirecto", async () => {
    route.query = {};
    const wrapper = await mountView();
    expect(modal(wrapper).exists()).toBe(false);

    await wrapper.findAll(".action-buttons button")[0].trigger("click");
    await rate(wrapper);

    expect(reviews()[0]).toMatchObject({ bookingId: 6, source: "direct" });
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([
    ["el botón Cancelar", (w) => w.find(".modal-actions .btn-secondary").trigger("click")],
    ["un clic fuera", (w) => w.find(".modal-overlay").trigger("click")],
  ])("testCerrarCon %s: quita el enlace y conserva otros parámetros", async (_, close) => {
    route.query = { ...fromEmail, lang: "es" };
    const wrapper = await mountView();

    await close(wrapper);

    expect(modal(wrapper).exists()).toBe(false);
    expect(replace).toHaveBeenCalledWith({ path: "/client/bookings", query: { lang: "es" } });
    expect(reviews()).toHaveLength(0);
  });

  it("testOtraReserva_DespuesDeCerrarYaNoCuentaComoRecordatorio", async () => {
    const wrapper = await mountView();
    await wrapper.find(".modal-actions .btn-secondary").trigger("click");

    await wrapper.findAll(".action-buttons button")[0].trigger("click");
    await rate(wrapper);

    expect(reviews()[0]).toMatchObject({ bookingId: 6, source: "direct" });
  });

  // Escenario 2
  it.each([
    ["ya calificada", "8", "Ya calificaste esa reserva."],
    ["sin completar", "9", "Esa reserva todavía no se puede calificar."],
    ["ajena o inexistente", "999", "No encontramos la reserva del recordatorio."],
    ["con un id inválido", "abc", "No encontramos la reserva del recordatorio."],
  ])("testReserva %s: lo explica sin abrir la reseña", async (_, reviewBookingId, message) => {
    route.query = { reviewBookingId, source: "reminder" };

    const wrapper = await mountView();

    expect(modal(wrapper).exists()).toBe(false);
    expect(useToastStore().message).toBe(message);
    expect(replace).toHaveBeenCalledWith({ path: "/client/bookings", query: {} });
  });

  it("testErrorAlEnviar_DejaLaResenaAbierta", async () => {
    post.mockImplementation(async (url) => {
      if (url !== "/reviews") return { data: {} };
      throw { response: { status: 400, data: { error: "Esta reserva ya tiene una reseña" } } };
    });
    const wrapper = await mountView();

    await rate(wrapper);

    expect(modal(wrapper).exists()).toBe(true);
    expect(useToastStore().message).toBe("Esta reserva ya tiene una reseña");
    expect(events("review_submitted")).toHaveLength(0);
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([["tratamiento", 100, "treatment"], ["control", 0, "control"]])(
    "testExposicion en %s se registra al abrir Mis reservas", async (_, percent, variant) => {
      config = experiment(percent);

      await mountView();

      const [exposure] = events("experiment_exposure");
      expect(exposure).toMatchObject({ experimentId: "EC-BLQ03", variant });
      expect(exposure.properties).toEqual({ location: "client_bookings" });
    });

  it("testControl_NoEnviaOrigenPeroLaResenaSeMide", async () => {
    config = experiment(0);
    const wrapper = await mountView();
    expect(modal(wrapper).exists()).toBe(false);

    await wrapper.findAll(".action-buttons button")[1].trigger("click");
    await rate(wrapper);

    expect(reviews()[0]).not.toHaveProperty("source");
    expect(events("review_submitted")[0]).toMatchObject({ experimentId: "EC-BLQ03", variant: "control" });
  });

  it("testFlag_ApagadoSinExposicion", async () => {
    config = experiment(100, false);

    await mountView();

    expect(events("experiment_exposure")).toHaveLength(0);
  });

  it("testTextosEnIngles", async () => {
    i18n.global.locale.value = "en";
    route.query = { reviewBookingId: "8" };

    await mountView();

    expect(useToastStore().message).toBe("You already rated that booking.");
  });
});

describe("US35 - Regreso al enlace tras iniciar sesión", () => {
  const link = "/client/bookings?reviewBookingId=7&source=reminder";
  const user = { id: 1, role: "client" };

  beforeEach(() => useAuthStore().clearAuth());

  async function visit(path) {
    const { default: appRouter } = await import("../src/router.js");
    await appRouter.push(path);
    return appRouter.currentRoute.value.fullPath;
  }

  async function signIn(response) {
    post.mockResolvedValue({ data: response });
    useAuthStore().setChallengeToken("reto-2fa");
    const wrapper = mount(TwoFactorVerifyView, { global: { plugins: [i18n] } });
    await wrapper.find("input").setValue("123456");
    await wrapper.find(".submit-btn").trigger("click");
    await flushPromises();
    return push.mock.calls.at(-1)[0];
  }

  it("testSinSesion_PideIniciarSesionYRecuerdaElEnlaceUnaSolaVez", async () => {
    expect(await visit(link)).toBe("/login");

    expect(takeReturnPath("client")).toBe(link);
    expect(takeReturnPath("client")).toBeNull();
  });

  it("testOtraRutaSinSesion_NoSeRecuerda", async () => {
    await visit("/client/profile");

    expect(takeReturnPath("client")).toBeNull();
  });

  it("testOtroRol_NoVuelveAlEnlace", () => {
    rememberReturnPath({ fullPath: link, query: fromEmail });

    expect(takeReturnPath("worker")).toBeNull();
    expect(takeReturnPath("client")).toBeNull();
  });

  it.each([
    ["sin cambio pendiente", false],
    ["con cambio solicitado", true],
  ])("testInicioDeSesion %s: vuelve al enlace", async (_, passwordChangeRequired) => {
    await visit(link);

    expect(await signIn({ user, token: "t", passwordChangeRequired })).toBe(link);
  });

  it("testCambioObligatorio_PrimeroLaContrasenaYDespuesElEnlace", async () => {
    await visit(link);

    expect(await signIn({ requiresPasswordChange: true, challengeToken: "reto" })).toBe("/change-password");
    expect(await signIn({ user, token: "t" })).toBe(link);
  });

  it("testSinEnlace_ElInicioDeSesionNoCambia", async () => {
    expect(await signIn({ user, token: "t" })).toBe("/client/search");
  });
});
