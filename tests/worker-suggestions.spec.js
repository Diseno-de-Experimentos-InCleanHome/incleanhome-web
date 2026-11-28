/**
 * US33 — prestadores/as sugeridos al reservar. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, enableAutoUnmount, RouterLinkStub } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { reactive } from "vue";

const route = reactive({ params: { id: "3" }, query: {} });
const push = vi.fn();
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push, back: vi.fn() }) }));

const get = vi.fn();
const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { useExperimentStore } from "../src/Experiments/application/experiment.store.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import { DistrictStorage } from "../src/Shared/infrastructure/storage/district.storage.js";
import BookingView from "../src/Booking/presentation/views/BookingView.vue";

const workers = {
  3: { id: 3, name: "Alex Prueba", serviceTypes: ["limpieza_general", "planchado"], hourlyRate: 20 },
  5: { id: 5, name: "Cris Cercana", serviceTypes: ["planchado", "limpieza_general"], hourlyRate: 30 },
};
const suggested = [
  { ...workers[5], averageRating: 4.8, totalServices: 6, approxDistanceKm: 0 },
  { ...workers[3], averageRating: 0, totalServices: 0, approxDistanceKm: 2.5 },
];
const experiment = (percent, isEnabled = true) =>
  ({ experiments: [{ id: "EC-BLQ01", enabled: isEnabled, treatmentPercent: percent }] });
const failure = (status, data = {}) => Promise.reject({ response: { status, data } });

let config;
let suggestions;

const events = (name) => TrackingStorage.getOutbox().filter((e) => e.eventName === name);
const suggestionCalls = () => get.mock.calls.filter(([url]) => url === "/workers/suggestions");
const bookings = () => post.mock.calls.filter(([url]) => url === "/bookings").map(([, body]) => body);
const panel = (wrapper) => wrapper.find('[data-test="suggestions"]');
const items = (wrapper) => wrapper.findAll('[data-test="suggestion"]');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 27, 12, 0, 0));
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  useAuthStore().updateUser({ id: 1, role: "client" });
  i18n.global.locale.value = "es";
  route.params = { id: "3" };
  config = experiment(100);
  suggestions = () => Promise.resolve({ data: suggested });
  get.mockImplementation((url) => {
    if (url === "/workers/suggestions") return suggestions();
    const id = url.match(/^\/workers\/(\d+)$/)?.[1];
    return Promise.resolve({ data: id ? workers[id] : config });
  });
  post.mockImplementation((_, body) => Promise.resolve({
    data: { id: 9, serviceType: body.serviceType, status: "pending", totalAmount: 60 },
  }));
  push.mockImplementation((path) => {
    const id = path.match(/^\/client\/worker\/(\d+)\/book$/)?.[1];
    if (id) route.params = { id };
  });
});
afterEach(() => vi.useRealTimers());
// Las vistas comparten la ruta simulada: se desmontan para que no reaccionen en otra prueba.
enableAutoUnmount(afterEach);

async function mountView() {
  await useExperimentStore().load(); // en la app lo pide main.js al iniciar
  const wrapper = mount(BookingView, {
    global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: RouterLinkStub } },
  });
  await flushPromises();
  return wrapper;
}

async function pickDate(wrapper) {
  await wrapper.findAll(".cal-day").find((day) => day.text() === "30").trigger("click");
  await flushPromises();
}

async function ask(wrapper, district = "miraflores") {
  if (district) await wrapper.find("#suggestion-district").setValue(district);
  await wrapper.find('[data-test="suggestions-search"]').trigger("click");
  await flushPromises();
}

/** Fecha y distrito elegidos y sugerencias en pantalla. */
async function withSuggestions() {
  const wrapper = await mountView();
  await pickDate(wrapper);
  await ask(wrapper);
  return wrapper;
}

async function choose(wrapper, index) {
  await items(wrapper)[index].find("button").trigger("click");
  await flushPromises();
}

async function confirm(wrapper) {
  await wrapper.find('input[type="text"]').setValue("Av. Larco 123");
  await wrapper.find("button.btn-lg").trigger("click");
  await flushPromises();
}

describe("US33 - Sugerencias en la reserva", () => {
  // Escenario 1
  it("testConsulta_EnviaServicioFechaHorarioYDistrito", async () => {
    await withSuggestions();

    expect(suggestionCalls()).toEqual([["/workers/suggestions", {
      params: {
        serviceType: "limpieza_general", date: "2026-11-30", startTime: "08:00", endTime: "10:00",
        district: "miraflores",
      },
    }]]);
  });

  it("testResultados_EnElOrdenDelApiConDistanciaYCalificacion", async () => {
    const wrapper = await withSuggestions();

    expect(items(wrapper)).toHaveLength(2);
    const [first, second] = items(wrapper).map((item) => item.text());
    expect(first).toContain("Cris Cercana");
    expect(first).toContain("★ 4.8");
    expect(first).toContain("En tu distrito");
    expect(first).toContain("S/ 30.00");
    expect(second).toContain("A 2.5 km aprox.");
    expect(second).toContain("Sin calificaciones");
  });

  it.each([
    ["sin fecha", {}, "Elige la fecha del servicio."],
    ["sin distrito", { date: true, district: "" }, "Selecciona el distrito del servicio."],
    ["con horario corto", { date: true, end: "07:00" }, "Elige un horario de al menos 30 minutos."],
  ])("testFaltanDatos %s: no consulta y lo explica", async (_, data, message) => {
    const wrapper = await mountView();
    if (data.date) await pickDate(wrapper);
    if (data.end) {
      const end = wrapper.findAll(".grid-2-cols select")[1];
      await end.setValue(data.end);
      await end.trigger("change");
    }

    await ask(wrapper, data.district ?? "miraflores");

    expect(panel(wrapper).text()).toContain(message);
    expect(suggestionCalls()).toHaveLength(0);
  });

  it("testDistrito_SeRecuerdaParaLaProximaVez", async () => {
    await withSuggestions();
    expect(DistrictStorage.get(1)).toBe("miraflores");

    const again = await mountView();

    expect(again.find("#suggestion-district").element.value).toBe("miraflores");
  });

  // Escenario 2
  it("testSinSugerencias_LoInformaYOfreceLosFiltros", async () => {
    suggestions = () => Promise.resolve({ data: [] });

    const wrapper = await withSuggestions();

    const empty = wrapper.find('[data-test="suggestions-empty"]');
    expect(empty.text()).toContain("No hay sugerencias");
    expect(empty.findComponent(RouterLinkStub).props("to")).toBe("/client/search");
  });

  // Escenario 3
  it("testSinPermiso_403VuelveALaReservaNormal", async () => {
    suggestions = () => failure(403, { error: "La funcionalidad no está activa para tu cuenta" });
    const wrapper = await withSuggestions();

    expect(panel(wrapper).exists()).toBe(false);
    expect(wrapper.text()).not.toContain("no está activa");
    await confirm(wrapper);

    expect(bookings()[0]).not.toHaveProperty("origin");
    expect(push).toHaveBeenCalledWith("/client/bookings");
  });

  it.each([
    [400, { error: "La fecha no puede estar en el pasado" }, "La fecha no puede estar en el pasado"],
    [500, {}, "Ocurrió un error"],
  ])("testError_%i se muestra sin sugerencias", async (status, data, message) => {
    suggestions = () => failure(status, data);

    const wrapper = await withSuggestions();

    expect(panel(wrapper).text()).toContain(message);
    expect(items(wrapper)).toHaveLength(0);
    expect(events("worker_suggestions_shown")).toHaveLength(0);
  });

  it("testCambiarLosDatos_QuitaLasSugerencias", async () => {
    const wrapper = await withSuggestions();

    await wrapper.find("#suggestion-district").setValue("lince");

    expect(items(wrapper)).toHaveLength(0);
  });

  it("testRespuestaAtrasada_SeIgnora", async () => {
    let answer;
    suggestions = () => new Promise((resolve) => { answer = resolve; });
    const wrapper = await withSuggestions();
    await wrapper.find("#suggestion-district").setValue("lince");

    answer({ data: suggested });
    await flushPromises();

    expect(items(wrapper)).toHaveLength(0);
    expect(wrapper.find('[data-test="suggestions-search"]').attributes("disabled")).toBeUndefined();
  });

  // Escenario 4
  it("testElegirOtraPersona_MantieneElFormularioYReservaConOrigen", async () => {
    const wrapper = await withSuggestions();
    await wrapper.find('input[type="text"]').setValue("Av. Larco 123");

    await choose(wrapper, 0);

    expect(push).toHaveBeenCalledWith("/client/worker/5/book");
    expect(wrapper.find(".worker-name").text()).toBe("Cris Cercana");
    expect(wrapper.find('input[type="text"]').element.value).toBe("Av. Larco 123");
    expect(wrapper.find(".cal-day-selected").text()).toBe("30");
    expect(wrapper.find("select").element.value).toBe("limpieza_general");
    expect(items(wrapper)[0].text()).toContain("Elegido para esta reserva");
    await wrapper.find("button.btn-lg").trigger("click");
    await flushPromises();

    expect(bookings()).toEqual([expect.objectContaining({
      workerId: 5, serviceType: "limpieza_general", date: "2026-11-30", origin: "suggestion",
    })]);
  });

  it("testEventos_DeLaSugerenciaALaReserva", async () => {
    const wrapper = await withSuggestions();
    await choose(wrapper, 0);
    await confirm(wrapper);

    const [search] = events("worker_search_performed");
    const { searchId } = search.properties;
    expect(search).toMatchObject({ experimentId: "EC-BLQ01", variant: "treatment", featureActive: true });
    expect(search.properties).toEqual({
      searchId, searchMode: "suggestion", serviceCategory: "limpieza_general", district: "miraflores",
      filtersApplied: 2, resultsCount: 2,
    });
    expect(events("worker_suggestions_shown")[0].properties).toEqual({ searchId, suggestionCount: 2 });

    const [direct, fromSuggestion] = events("booking_form_opened");
    expect(direct.properties).not.toHaveProperty("origin");
    expect(fromSuggestion.properties).toMatchObject({ workerId: 5, origin: "suggestion", searchId });
    expect(fromSuggestion.properties.formId).not.toBe(direct.properties.formId);

    const [created] = events("booking_request_created");
    expect(created.properties).toMatchObject({
      origin: "suggestion", searchId, formId: fromSuggestion.properties.formId,
    });
    expect(JSON.stringify(TrackingStorage.getOutbox())).not.toContain("Larco");
  });

  it("testElegirALaMismaPersona_SoloMarcaElOrigen", async () => {
    const wrapper = await withSuggestions();

    await choose(wrapper, 1);
    await confirm(wrapper);

    expect(push).not.toHaveBeenCalledWith("/client/worker/3/book");
    expect(bookings()[0]).toMatchObject({ workerId: 3, origin: "suggestion" });
  });

  it("testVolverALaPersonaAnterior_YaNoEsUnaSugerencia", async () => {
    const wrapper = await withSuggestions();
    await choose(wrapper, 0);

    route.params = { id: "3" };
    await flushPromises();
    await confirm(wrapper);

    expect(bookings()[0].workerId).toBe(3);
    expect(bookings()[0]).not.toHaveProperty("origin");
  });

  it("testSiNoCargaElElegido_NoSePuedeConfirmar", async () => {
    const wrapper = await withSuggestions();
    const base = get.getMockImplementation();
    get.mockImplementation((url) => (url === "/workers/5" ? failure(500) : base(url)));

    await choose(wrapper, 0);
    await confirm(wrapper);

    expect(wrapper.find("button.btn-lg").attributes("disabled")).toBeDefined();
    expect(wrapper.find(".error-box").text()).toContain("Ocurrió un error");
    expect(bookings()).toHaveLength(0);

    route.params = { id: "3" };
    await flushPromises();

    expect(wrapper.find(".error-box").exists()).toBe(false);
    expect(wrapper.find("button.btn-lg").attributes("disabled")).toBeUndefined();
  });

  it.each([["tratamiento", 100, true], ["control", 0, false]])(
    "testExposicion en %s se registra al abrir la reserva", async (variant, percent, visible) => {
      config = experiment(percent);

      const wrapper = await mountView();

      const exposure = events("experiment_exposure").find((e) => e.experimentId === "EC-BLQ01");
      expect(exposure).toMatchObject({ variant: variant === "control" ? "control" : "treatment" });
      expect(exposure.properties).toEqual({ location: "booking_form" });
      expect(panel(wrapper).exists()).toBe(visible);
    });

  it("testFlag_ApagadoSinExposicion", async () => {
    config = experiment(100, false);

    const wrapper = await mountView();

    expect(panel(wrapper).exists()).toBe(false);
    expect(events("experiment_exposure")).toHaveLength(0);
  });

  it("testTextosEnIngles", async () => {
    i18n.global.locale.value = "en";

    const wrapper = await withSuggestions();

    expect(panel(wrapper).text()).toContain("Suggested workers");
    expect(items(wrapper)[0].text()).toContain("In your district");
    expect(items(wrapper)[1].text()).toContain("About 2.5 km away");
  });
});
