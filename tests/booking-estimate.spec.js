/**
 * US41 — monto estimado antes de confirmar la reserva. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { params: { id: "3" }, query: {} };
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

const get = vi.fn();
const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import { BookingPricingService, minimumDuration } from "../src/Booking/domain/services/booking-pricing.service.js";
import { formatCurrency } from "../src/Shared/domain/format/currency.js";
import BookingView from "../src/Booking/presentation/views/BookingView.vue";

describe("US41 - Duración y total", () => {
  // Mismos vectores que las pruebas del backend
  it.each([
    ["09:00", "11:00", 2],
    ["09:00", "10:30", 1.5],
    ["09:00", "10:40", 1.67],
    ["09:00", "09:50", 0.83],
    ["09:00", "09:30", 0.5],
    ["00:00", "23:59", 23.98],
  ])("testHoras_DerivaLaDuracion de %s a %s", (start, end, hours) => {
    expect(BookingPricingService.hoursBetween(start, end)).toBe(hours);
  });

  it.each([["11:00", "09:00"], ["09:00", "09:00"], ["", "10:00"], ["9:00", "10:00"], ["09:00", "24:00"]])(
    "testHoras_HorarioNoValido de '%s' a '%s'", (start, end) => {
      expect(BookingPricingService.hoursBetween(start, end)).toBeNull();
    });

  // [tarifa, inicio, fin, total] — el medio céntimo se redondea al par, como en el API
  it.each([
    [30, "09:00", "10:40", 50.1],
    [33.33, "09:00", "10:30", 50],
    [25.25, "09:00", "09:30", 12.62],
    [25.35, "09:00", "09:30", 12.68],
    [50, "09:00", "12:00", 150],
  ])("testTotal_RedondeoDelApi tarifa %s", (rate, start, end, total) => {
    expect(BookingPricingService.estimate(rate, start, end).totalAmount).toBe(total);
  });

  it("testEstimado_DuracionMinimaDe30Minutos", () => {
    expect(BookingPricingService.estimate(20, "09:00", "09:29")).toBeNull();
    expect(BookingPricingService.estimate(20, "09:00", "09:30")).not.toBeNull();
    expect(BookingPricingService.estimate(0, "09:00", "11:00")).toBeNull();
    expect(BookingPricingService.estimate(undefined, "09:00", "11:00")).toBeNull();
  });

  it("testRegla_DuracionMinima", () => {
    const rule = minimumDuration("startTime", "corta");

    expect(rule("09:29", { startTime: "09:00" })).toBe("corta");
    expect(rule("09:30", { startTime: "09:00" })).toBeNull();
    // Un fin anterior al inicio lo informa la regla de orden, no esta
    expect(rule("08:00", { startTime: "09:00" })).toBeNull();
  });

  it("testMoneda_FormatoUnico", () => {
    expect(formatCurrency(50.1)).toBe("S/ 50.10");
    expect(formatCurrency("33.4")).toBe("S/ 33.40");
    expect(formatCurrency(0)).toBe("S/ 0.00");
    for (const value of [null, undefined, "", "abc"]) expect(formatCurrency(value)).toBe("—");
  });
});

describe("US41 - Formulario de reserva", () => {
  const worker = { id: 3, name: "Alex Prueba", serviceTypes: ["limpieza_general"], hourlyRate: 20 };
  let config;
  let estimateResponse;

  const events = (name) => TrackingStorage.getOutbox().filter((e) => e.eventName === name);
  const estimateCalls = () => post.mock.calls.filter(([url]) => url === "/bookings/estimate");
  const text = (wrapper, id) => wrapper.find(`[data-test="${id}"]`).text();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useAuthStore().updateUser({ id: 1, role: "client" });
    config = { experiments: [{ id: "EC-BLQ06", enabled: true, treatmentPercent: 100 }] };
    estimateResponse = (payload) => {
      const result = BookingPricingService.estimate(20, payload.startTime, payload.endTime);
      return Promise.resolve({ data: result });
    };
    get.mockImplementation(async (url) => ({ data: url === "/experiments/config" ? config : worker }));
    post.mockImplementation((url, payload) => (url === "/bookings/estimate"
      ? estimateResponse(payload)
      : Promise.resolve({ data: { id: 9, serviceType: "limpieza_general", status: "pending", totalAmount: 40 } })));
  });

  async function mountView() {
    const wrapper = mount(BookingView, { global: { plugins: [i18n], stubs: { AppIcon: true } } });
    await flushPromises();
    return wrapper;
  }

  async function pickDate(wrapper) {
    await wrapper.findAll(".cal-nav")[1].trigger("click");
    await wrapper.find(".cal-day").trigger("click");
    await flushPromises();
  }

  async function pickTime(wrapper, index, value) {
    const select = wrapper.findAll(".grid-2-cols select")[index];
    await select.setValue(value);
    await select.trigger("change");
    await flushPromises();
  }

  async function confirm(wrapper) {
    await wrapper.find('input[type="text"]').setValue("Av. Larco 123");
    await wrapper.find("button.btn-lg").trigger("click");
    await flushPromises();
  }

  it("testPanel_MuestraTarifaDuracionYTotal", async () => {
    const wrapper = await mountView();

    expect(text(wrapper, "estimate-rate")).toBe("S/ 20.00");
    expect(text(wrapper, "estimate-hours")).toBe("2 h");
    expect(text(wrapper, "estimate-total")).toBe("S/ 40.00");
    expect(wrapper.find(".worker-rate").text()).toContain("S/ 20.00");
    expect(wrapper.find(".summary-card").exists()).toBe(false);
  });

  it("testPanel_SinFechaNoConsultaElApi", async () => {
    await mountView();

    expect(estimateCalls()).toHaveLength(0);
  });

  it("testPanel_ConsultaElApiConElContratoYRecalcula", async () => {
    const wrapper = await mountView();
    await pickDate(wrapper);

    await pickTime(wrapper, 1, "11:00");

    expect(text(wrapper, "estimate-hours")).toBe("3 h");
    expect(text(wrapper, "estimate-total")).toBe("S/ 60.00");
    const [, payload] = estimateCalls().at(-1);
    expect(payload).toEqual({
      workerId: 3, serviceType: "limpieza_general",
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), startTime: "08:00", endTime: "11:00",
    });
  });

  it("testPanel_MandaElMontoDelApiPorSobreElLocal", async () => {
    estimateResponse = () => Promise.resolve({ data: { hourlyRate: 25, hours: 2, totalAmount: 50 } });
    const wrapper = await mountView();

    await pickDate(wrapper);

    expect(text(wrapper, "estimate-rate")).toBe("S/ 25.00");
    expect(text(wrapper, "estimate-total")).toBe("S/ 50.00");
  });

  it("testPanel_IgnoraUnaRespuestaAtrasada", async () => {
    const pending = [];
    estimateResponse = () => new Promise((resolve) => pending.push(resolve));
    const wrapper = await mountView();
    await pickDate(wrapper);
    await pickTime(wrapper, 1, "11:00");

    pending[1]({ data: { hourlyRate: 20, hours: 3, totalAmount: 60 } });
    pending[0]({ data: { hourlyRate: 99, hours: 2, totalAmount: 198 } });
    await flushPromises();

    expect(text(wrapper, "estimate-total")).toBe("S/ 60.00");
  });

  it("testPanel_MuestraElMotivoDeUn400SinMonto", async () => {
    estimateResponse = () => Promise.reject({
      response: { status: 400, data: { error: "El trabajador no ofrece el servicio seleccionado." } },
    });
    const wrapper = await mountView();

    await pickDate(wrapper);

    expect(wrapper.find(".estimate-error").text()).toContain("no ofrece el servicio");
    expect(wrapper.find('[data-test="estimate-total"]').exists()).toBe(false);
  });

  it("testPanel_SinRespuestaMantieneElCalculoLocal", async () => {
    estimateResponse = () => Promise.reject({ request: {} });
    const wrapper = await mountView();

    await pickDate(wrapper);

    expect(text(wrapper, "estimate-total")).toBe("S/ 40.00");
  });

  it("testPanel_HorarioNoValidoSinMontoNiEnvio", async () => {
    const wrapper = await mountView();
    await pickDate(wrapper);

    await pickTime(wrapper, 1, "07:00");
    await confirm(wrapper);

    expect(wrapper.find('[data-test="estimate-total"]').exists()).toBe(false);
    expect(wrapper.find(".estimate-empty").exists()).toBe(true);
    expect(post.mock.calls.filter(([url]) => url === "/bookings")).toHaveLength(0);
  });

  it("testEvento_EstimadoVistoUnaVezPorFormulario", async () => {
    const wrapper = await mountView();
    await pickDate(wrapper);
    await pickTime(wrapper, 1, "12:00");

    const viewed = events("booking_estimate_viewed");
    expect(viewed).toHaveLength(1);
    expect(viewed[0]).toMatchObject({ experimentId: "EC-BLQ06", variant: "treatment", featureActive: true });
    expect(viewed[0].properties).toEqual({
      formId: events("booking_form_opened")[0].properties.formId, estimatedAmount: 40,
    });
    expect(events("experiment_exposure")[0].properties).toEqual({ location: "booking_form" });
  });

  it("testReserva_ComparaElMontoEstimadoConElRegistrado", async () => {
    const wrapper = await mountView();
    await pickDate(wrapper);

    await confirm(wrapper);

    const [, booking] = post.mock.calls.find(([url]) => url === "/bookings");
    expect(booking.hours).toBe(2);
    expect(events("booking_request_created")[0].properties).toMatchObject({
      estimatedAmount: 40, registeredAmount: 40, amountMatches: true,
    });
  });

  it.each([
    ["apagado", { experiments: [{ id: "EC-BLQ06", enabled: false, treatmentPercent: 100 }] }, null],
    ["en control", { experiments: [{ id: "EC-BLQ06", enabled: true, treatmentPercent: 0 }] }, "control"],
  ])("testFlag_%s mantiene el resumen actual", async (_, remote, variant) => {
    config = remote;
    const wrapper = await mountView();
    await pickDate(wrapper);

    expect(wrapper.find(".estimate-card").exists()).toBe(false);
    expect(wrapper.find(".summary-card").text()).toContain("2h × S/. 20");
    expect(wrapper.find(".total-amount").text()).toBe("S/. 40.00");
    expect(wrapper.find(".worker-rate").text()).toContain("S/. 20");
    expect(estimateCalls()).toHaveLength(0);
    expect(events("booking_estimate_viewed")).toHaveLength(0);
    expect(events("experiment_exposure")).toHaveLength(variant ? 1 : 0);
    expect(events("booking_form_opened")[0].variant).toBe(variant);
  });
});
