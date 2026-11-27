/**
 * US42 — eventos que registran las pantallas. El API siempre se simula y los eventos se
 * revisan en la cola local (sin token no se envían).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { params: { id: "3" }, query: {} };
const push = vi.fn();
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push, back: vi.fn() }) }));

const get = vi.fn();
const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), patch: vi.fn(), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { TrackingService } from "../src/Tracking/application/tracking.service.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import SearchView from "../src/SearchAndCatalog/presentation/views/SearchView.vue";
import WorkerProfileView from "../src/SearchAndCatalog/presentation/views/WorkerProfileView.vue";
import BookingView from "../src/Booking/presentation/views/BookingView.vue";
import ClientBookingsView from "../src/Booking/presentation/views/ClientBookingsView.vue";

const worker = {
  id: 3, name: "Alex Prueba", serviceTypes: ["limpieza_general"], zones: ["miraflores"],
  hourlyRate: 20, averageRating: 4, totalServices: 1,
};
const experimentsOff = { experiments: [] };

function routes(extra = {}) {
  const data = {
    "/experiments/config": experimentsOff,
    "/workers": [worker],
    "/workers/3": worker,
    "/workers/3/availability": [],
    "/reviews/worker/3": [{ id: 1, bookingId: 2, workerId: 3, rating: 5, comment: "Bien" }],
    ...extra,
  };
  get.mockImplementation(async (url) => ({ data: data[url] }));
}

const events = (name) => TrackingStorage.getOutbox().filter((e) => !name || e.eventName === name);

async function mountView(component) {
  const wrapper = mount(component, {
    global: { plugins: [i18n], stubs: { AppIcon: true, WorkerCard: true, RouterLink: true } },
  });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  useAuthStore().updateUser({ id: 1, role: "client" });
  routes();
});
afterEach(() => vi.useRealTimers());

describe("US42 - Búsqueda", () => {
  it("testBusqueda_ElListadoInicialNoSeRegistra", async () => {
    vi.useFakeTimers();
    const wrapper = await mountView(SearchView);

    await vi.advanceTimersByTimeAsync(2000);
    wrapper.unmount();

    expect(events()).toEqual([]);
  });

  it("testBusqueda_RegistraLaBusquedaDelClienteCuandoSeEstabiliza", async () => {
    vi.useFakeTimers();
    const wrapper = await mountView(SearchView);
    const [service, zone] = wrapper.findAll(".filters-sidebar select");

    await service.setValue("limpieza_general");
    await service.trigger("change");
    await vi.advanceTimersByTimeAsync(300);
    await zone.setValue("miraflores");
    await zone.trigger("change");
    await vi.advanceTimersByTimeAsync(800);

    const recorded = events("worker_search_performed");
    expect(recorded).toHaveLength(1);
    expect(recorded[0].properties).toMatchObject({
      serviceCategory: "limpieza_general", district: "miraflores",
      filtersApplied: 2, resultsCount: 1, searchMode: "filters",
    });
    expect(recorded[0].userRole).toBe("client");
  });

  it("testBusqueda_SeRegistraAlSalirDeLaPantalla", async () => {
    const wrapper = await mountView(SearchView);
    await wrapper.find(".link-btn").trigger("click");
    await flushPromises();

    wrapper.unmount();

    expect(events("worker_search_performed")[0].properties.filtersApplied).toBe(0);
  });

  it("testBusqueda_FallidaNoSeRegistra", async () => {
    const wrapper = await mountView(SearchView);
    get.mockRejectedValue(new Error("network"));

    await wrapper.find(".link-btn").trigger("click");
    await flushPromises();
    wrapper.unmount();

    expect(events()).toEqual([]);
  });
});

describe("US42 - Perfil y reseñas", () => {
  it("testPerfil_RegistraPerfilYResenasVistas", async () => {
    await mountView(WorkerProfileView);

    expect(events("worker_profile_viewed")[0].properties).toEqual({ workerId: 3, platform: "web" });
    expect(events("worker_reviews_viewed")[0].properties).toEqual({ workerId: 3, reviewCount: 1 });
  });

  it("testPerfil_ConElExperimentoActivoMarcaElEvento", async () => {
    routes({ "/experiments/config": { experiments: [{ id: "EC-BLQ02", enabled: true, treatmentPercent: 0 }] } });

    await mountView(WorkerProfileView);

    expect(events("worker_profile_viewed")[0]).toMatchObject({
      experimentId: "EC-BLQ02", variant: "control", featureActive: false,
    });
  });
});

describe("US42 - Reserva", () => {
  async function submitBooking() {
    const wrapper = await mountView(BookingView);
    await wrapper.findAll(".cal-nav")[1].trigger("click");
    await wrapper.find(".cal-day").trigger("click");
    await wrapper.find('input[type="text"]').setValue("Av. Larco 123");
    await wrapper.find("button.btn-lg").trigger("click");
    await flushPromises();
    return wrapper;
  }

  it("testReserva_RegistraFormularioAbierto", async () => {
    await mountView(BookingView);

    const [opened] = events("booking_form_opened");
    expect(opened.properties).toMatchObject({ workerId: 3, platform: "web" });
    expect(opened.properties.formId).toBeTruthy();
  });

  it("testReserva_CreadaConElMismoFormIdYSinDireccion", async () => {
    post.mockResolvedValue({ data: { id: 9, serviceType: "limpieza_general", status: "pending", totalAmount: 40 } });

    await submitBooking();

    const [created] = events("booking_request_created");
    expect(created.properties).toMatchObject({
      bookingId: 9, serviceCategory: "limpieza_general", status: "pending",
      registeredAmount: 40, capturedBy: "client",
      formId: events("booking_form_opened")[0].properties.formId,
    });
    expect(JSON.stringify(events())).not.toContain("Larco");
  });

  it("testReserva_FallidaConTipoDeError", async () => {
    post.mockRejectedValue({ response: { status: 400, data: { error: "Cruce de horarios" } } });

    const wrapper = await submitBooking();

    expect(events("booking_request_failed")[0].properties).toMatchObject({
      errorType: "http_400", platform: "web", capturedBy: "client",
    });
    expect(events("booking_request_created")).toEqual([]);
    expect(wrapper.find(".error-box").text()).toBe("Cruce de horarios");
  });
});

describe("US42 - Reseña enviada", () => {
  it("testResena_RegistraEnvioSinElComentario", async () => {
    get.mockResolvedValue({ data: [{
      id: 5, workerId: 3, workerName: "Alex", serviceType: "limpieza_general",
      status: "completed", hasReview: false, address: "Calle 1", totalAmount: 40,
    }] });
    post.mockResolvedValue({ data: { id: 1, bookingId: 5, rating: 4, isVerified: true } });
    const wrapper = await mountView(ClientBookingsView);

    await wrapper.find(".btn-outline").trigger("click");
    await wrapper.findAll(".rating-btn")[3].trigger("click");
    await wrapper.find(".modal-box textarea").setValue("Muy puntual");
    await wrapper.find(".modal-actions .btn-primary").trigger("click");
    await flushPromises();

    expect(events("review_submitted")[0].properties).toEqual({
      bookingId: 5, rating: 4, isVerified: true, source: "direct", capturedBy: "client",
    });
    expect(JSON.stringify(events())).not.toContain("puntual");
  });
});

describe("US42 - Exposición al experimento (US43, escenario 3)", () => {
  const config = (enabled) => ({
    "/experiments/config": { experiments: [{ id: "EC-BLQ06", enabled, treatmentPercent: 50 }] },
  });

  it("testExposicion_UnaSolaVezConExperimentoYVariante", async () => {
    routes(config(true));

    for (let i = 0; i < 3; i++) TrackingService.recordExposure("EC-BLQ06", "booking_form");
    await flushPromises();

    const exposures = events("experiment_exposure");
    expect(exposures).toHaveLength(1);
    expect(exposures[0]).toMatchObject({ experimentId: "EC-BLQ06", properties: { location: "booking_form" } });
    expect(["control", "treatment"]).toContain(exposures[0].variant);
  });

  it("testExposicion_ConElExperimentoApagadoNoSeRegistra", async () => {
    routes(config(false));

    TrackingService.recordExposure("EC-BLQ06", "booking_form");
    await flushPromises();

    expect(events()).toEqual([]);
  });
});
