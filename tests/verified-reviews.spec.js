/**
 * US34 — reseñas verificadas e historial del prestador/a. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { params: { id: "3" }, query: {} };
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

const get = vi.fn();
const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), patch: vi.fn(), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import { Review } from "../src/ReviewsAndEvaluation/domain/model/review.entity.js";
import { ReviewSummary } from "../src/ReviewsAndEvaluation/domain/model/review-summary.value.js";
import { ReviewApi } from "../src/ReviewsAndEvaluation/infrastructure/review.api.js";
import { dateFromIsoDay } from "../src/Shared/domain/format/dates.js";
import WorkerProfileView from "../src/SearchAndCatalog/presentation/views/WorkerProfileView.vue";
import ClientBookingsView from "../src/Booking/presentation/views/ClientBookingsView.vue";

const review = (id, extra = {}) => ({
  id, bookingId: id + 10, clientId: 1, workerId: 3, clientName: `Cliente ${id}`, rating: 5,
  comment: `Comentario ${id}`, createdAt: "2026-10-05T15:00:00Z", serviceType: "limpieza_general",
  serviceDate: "2026-10-03", isVerified: true, ...extra,
});
const summary = (extra = {}) => ({
  workerId: 3, verifiedReviewCount: 3, averageRating: 4.33,
  distribution: { 5: 2, 4: 0, 3: 1, 2: 0, 1: 0 }, completedServices: 4,
  message: "Reseñas de servicios completados", ...extra,
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  useAuthStore().updateUser({ id: 1, role: "client" });
  i18n.global.locale.value = "es";
});

describe("US34 - Dominio y API", () => {
  it("testResena_ConservaServicioFechaYVerificacion", () => {
    expect(Review.fromApi(review(1))).toMatchObject({
      serviceType: "limpieza_general", serviceDate: "2026-10-03", isVerified: true,
    });
    // Sin esos campos la reseña no se muestra como verificada
    expect(Review.fromApi({ id: 2, rating: 4 })).toMatchObject({
      serviceType: null, serviceDate: null, isVerified: false,
    });
  });

  it("testResumen_DistribucionDe5A1YPromedioConUnDecimal", () => {
    const result = ReviewSummary.fromApi(summary());

    expect(result.distribution.map((row) => [row.stars, row.count])).toEqual(
      [[5, 2], [4, 0], [3, 1], [2, 0], [1, 0]]);
    expect(result.averageRating()).toBe(4.3);
    expect(result.completedServices).toBe(4);
    expect(result.share(2)).toBeCloseTo(66.67, 1);
  });

  it("testResumen_SinResenasNoHayPromedio", () => {
    const result = ReviewSummary.fromApi(summary({
      verifiedReviewCount: 0, averageRating: null, distribution: {},
    }));

    expect(result.hasReviews()).toBe(false);
    expect(result.averageRating()).toBeNull();
    expect(result.share(0)).toBe(0);
    expect(result.distribution).toHaveLength(5);
  });

  it("testFecha_ElDiaDelServicioNoSeDesplaza", () => {
    const date = dateFromIsoDay("2026-10-03");

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 3]);
    expect(dateFromIsoDay("03/10/2026")).toBeNull();
    expect(dateFromIsoDay(null)).toBeNull();
  });

  it("testApi_EnviaOrdenYFiltroSoloCuandoExisten", async () => {
    get.mockResolvedValue({ data: [] });

    await ReviewApi.listForWorker(3, { sort: "oldest", serviceType: "" });
    await ReviewApi.listForWorker(3);

    expect(get.mock.calls[0]).toEqual(["/reviews/worker/3", { params: { sort: "oldest", serviceType: undefined } }]);
    expect(get.mock.calls[1]).toEqual(["/reviews/worker/3", { params: { sort: undefined, serviceType: undefined } }]);
  });
});

describe("US34 - Perfil del prestador/a", () => {
  const worker = { id: 3, name: "Alex Prueba", serviceTypes: ["limpieza_general", "cocina"], hourlyRate: 20, averageRating: 0, totalServices: 4 };
  const list = [
    review(1),
    review(2, { rating: 3, serviceType: "cocina", serviceDate: "2026-09-01" }),
    review(3, { isVerified: false, serviceType: "planchado" }),
  ];
  let config;
  let summaryResponse;
  let listResponse;

  const enabled = (percent) => ({ experiments: [{ id: "EC-BLQ02", enabled: true, treatmentPercent: percent }] });
  const events = (name) => TrackingStorage.getOutbox().filter((e) => e.eventName === name);
  const calls = (url) => get.mock.calls.filter(([called]) => called === url);

  beforeEach(() => {
    config = enabled(100);
    summaryResponse = () => Promise.resolve({ data: summary() });
    listResponse = () => Promise.resolve({ data: list });
    get.mockImplementation((url, options) => {
      if (url === "/experiments/config") return Promise.resolve({ data: config });
      if (url === "/workers/3") return Promise.resolve({ data: worker });
      if (url === "/workers/3/availability") return Promise.resolve({ data: [] });
      if (url === "/reviews/worker/3/summary") return summaryResponse();
      return listResponse(options?.params ?? {});
    });
  });

  async function mountView() {
    const wrapper = mount(WorkerProfileView, { global: { plugins: [i18n], stubs: { AppIcon: true } } });
    await flushPromises();
    return wrapper;
  }

  const rows = (wrapper) => wrapper.findAll(".review-row");
  const test = (wrapper, id) => wrapper.find(`[data-test="${id}"]`);

  // US34 - Escenario 1: solo reseñas verificadas, con servicio y fecha
  it("testTratamiento_InsigniaServicioYFecha", async () => {
    const wrapper = await mountView();

    expect(rows(wrapper)).toHaveLength(2);
    expect(rows(wrapper)[0].find(".verified-badge").text()).toBe("Reseña verificada");
    expect(rows(wrapper)[0].find('[data-test="service"]').text()).toBe("Limpieza general · 3 de octubre de 2026");
    expect(wrapper.text()).not.toContain("Comentario 3");
  });

  it("testTratamiento_PromedioDistribucionYServiciosCompletados", async () => {
    const wrapper = await mountView();

    expect(test(wrapper, "average").text()).toBe("4.3");
    expect(test(wrapper, "count").text()).toBe("3 reseñas verificadas");
    expect(test(wrapper, "completed").text()).toBe("4 servicios completados");
    expect(test(wrapper, "stars-5").text()).toContain("2");
    expect(test(wrapper, "stars-5").find(".bar-fill").attributes("style")).toContain("66.6");
    expect(wrapper.findAll(".distribution .bar-row")).toHaveLength(5);
    expect(test(wrapper, "verified-rating").text()).toContain("4.3");
  });

  it("testTratamiento_ElFiltroSoloOfreceServiciosConResenasVerificadas", async () => {
    const wrapper = await mountView();

    const options = test(wrapper, "service-filter").findAll("option").map((o) => o.attributes("value"));

    expect(options).toEqual(["", "cocina", "limpieza_general"]);
  });

  // US34 - Escenario 2: orden por fecha y filtro por servicio
  it("testTratamiento_OrdenYFiltroLosResuelveElApi", async () => {
    listResponse = ({ sort, serviceType }) => Promise.resolve({
      data: serviceType ? [list[1]] : sort === "oldest" ? [list[1], list[0]] : list,
    });
    const wrapper = await mountView();

    await test(wrapper, "sort").setValue("oldest");
    await flushPromises();
    expect(rows(wrapper)[0].text()).toContain("Comentario 2");
    expect(get).toHaveBeenLastCalledWith("/reviews/worker/3", { params: { sort: "oldest", serviceType: undefined } });

    await test(wrapper, "service-filter").setValue("cocina");
    await flushPromises();
    expect(rows(wrapper)).toHaveLength(1);
    expect(get).toHaveBeenLastCalledWith("/reviews/worker/3", { params: { sort: "oldest", serviceType: "cocina" } });
    // Las opciones no dependen del filtro y el resumen se pide una sola vez
    expect(test(wrapper, "service-filter").findAll("option")).toHaveLength(3);
    expect(calls("/reviews/worker/3/summary")).toHaveLength(1);
  });

  it("testTratamiento_FiltroSinCoincidencias", async () => {
    listResponse = ({ serviceType }) => Promise.resolve({ data: serviceType ? [] : list });
    const wrapper = await mountView();

    await test(wrapper, "service-filter").setValue("cocina");
    await flushPromises();

    expect(wrapper.text()).toContain("No hay reseñas verificadas para ese servicio.");
  });

  // US34 - Escenario 3: sin reseñas no se muestra un promedio
  it("testTratamiento_SinResenasMensajeClaroSinPromedio", async () => {
    summaryResponse = () => Promise.resolve({ data: summary({
      verifiedReviewCount: 0, averageRating: null, distribution: { 5: 0 }, completedServices: 1,
    }) });
    listResponse = () => Promise.resolve({ data: [] });

    const wrapper = await mountView();

    expect(test(wrapper, "no-reviews").text()).toBe("Este prestador/a todavía no tiene reseñas verificadas.");
    expect(test(wrapper, "completed").text()).toBe("1 servicio completado");
    expect(test(wrapper, "average").exists()).toBe(false);
    expect(test(wrapper, "verified-rating").text()).toBe("Sin reseñas verificadas");
    expect(wrapper.text()).not.toContain("0.0");
  });

  it("testTratamiento_ErrorConReintento", async () => {
    summaryResponse = () => Promise.reject({ request: {} });
    const wrapper = await mountView();
    expect(wrapper.find(".load-error").text()).toContain("No se pudieron cargar las reseñas verificadas.");

    summaryResponse = () => Promise.resolve({ data: summary() });
    await wrapper.find(".load-error button").trigger("click");
    await flushPromises();

    expect(wrapper.find(".load-error").exists()).toBe(false);
    expect(test(wrapper, "average").text()).toBe("4.3");
  });

  it("testTratamiento_TextosEnIngles", async () => {
    i18n.global.locale.value = "en";

    const wrapper = await mountView();

    expect(rows(wrapper)[0].find(".verified-badge").text()).toBe("Verified review");
    expect(rows(wrapper)[0].find('[data-test="service"]').text()).toContain("October 3, 2026");
  });

  // US34 - Escenario 4: evento de reseñas vistas
  it("testEvento_ResenasVistasYExposicion", async () => {
    await mountView();

    const [viewed] = events("worker_reviews_viewed");
    expect(viewed.properties).toEqual({ workerId: 3, reviewCount: 3, verifiedCount: 2 });
    expect(viewed).toMatchObject({ experimentId: "EC-BLQ02", variant: "treatment", featureActive: true });
    expect(events("experiment_exposure")[0].properties).toEqual({ location: "worker_profile" });
  });

  it.each([
    ["apagado", { experiments: [] }, 0],
    ["en control", enabled(0), 1],
  ])("testFlag_%s mantiene la lista actual", async (_, remote, exposures) => {
    config = remote;

    const wrapper = await mountView();

    expect(rows(wrapper)).toHaveLength(3); // todas, también la no verificada
    expect(wrapper.find(".verified-reviews").exists()).toBe(false);
    expect(wrapper.find(".verified-badge").exists()).toBe(false);
    expect(wrapper.find(".rating-value").text()).toBe("0.0");
    expect(calls("/reviews/worker/3/summary")).toHaveLength(0);
    expect(events("experiment_exposure")).toHaveLength(exposures);
  });
});

describe("US34 - Comentario obligatorio en la reseña", () => {
  async function openModal() {
    get.mockImplementation(async (url) => ({ data: url === "/experiments/config" ? { experiments: [] } : [{
      id: 5, workerId: 3, workerName: "Alex", serviceType: "limpieza_general",
      status: "completed", hasReview: false, totalAmount: 40,
    }] }));
    post.mockResolvedValue({ data: { id: 1, bookingId: 5, rating: 4, isVerified: true } });
    const wrapper = mount(ClientBookingsView, { global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: true } } });
    await flushPromises();
    await wrapper.find(".btn-outline").trigger("click");
    await wrapper.findAll(".rating-btn")[3].trigger("click");
    return wrapper;
  }

  async function send(wrapper, comment) {
    await wrapper.find(".modal-box textarea").setValue(comment);
    await wrapper.find(".modal-actions .btn-primary").trigger("click");
    await flushPromises();
  }

  const message = "Escribe un comentario de 1 a 1000 caracteres para enviar tu reseña";

  it.each([["vacío", ""], ["solo espacios", "   "], ["de más de 1000", "a".repeat(1001)]])(
    "testComentario_%s no se envía y explica el motivo", async (_, comment) => {
      const wrapper = await openModal();

      await send(wrapper, comment);

      expect(wrapper.find(".modal-box .field-error").text()).toBe(message);
      expect(post).not.toHaveBeenCalled();
    });

  it.each([1, 1000])("testComentario_De %s caracteres se envía", async (length) => {
    const wrapper = await openModal();

    await send(wrapper, "a".repeat(length));

    expect(post).toHaveBeenCalledWith("/reviews", {
      bookingId: 5, workerId: 3, rating: 4, comment: "a".repeat(length),
    });
    expect(wrapper.find(".modal-box").exists()).toBe(false);
  });

  it("testComentario_AlReabrirElModalNoQuedaElError", async () => {
    const wrapper = await openModal();
    await send(wrapper, "");

    await wrapper.find(".modal-actions .btn-secondary").trigger("click");
    await wrapper.find(".btn-outline").trigger("click");

    expect(wrapper.find(".modal-box .field-error").exists()).toBe(false);
  });
});
