/**
 * US36 — fechas, tiempos de atención y resumen de reclamos. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { query: {} };
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));

const get = vi.fn();
const patch = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), patch: (...a) => patch(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { nextStatuses, isClosed } from "../src/Claims/domain/model/claim-status.value.js";
import {
  formatDuration, secondsToClosure, secondsToFirstReview,
} from "../src/Claims/domain/services/claim-times.js";
import { parseApiDate } from "../src/Shared/domain/format/dates.js";
import AdminClaimsView from "../src/Claims/presentation/views/AdminClaimsView.vue";
import ClaimTrackView from "../src/Claims/presentation/views/ClaimTrackView.vue";

const claim = (id, status, extra = {}) => ({
  id, code: `RC-2026-00000${id}`, type: "reclamo", consumerName: "Persona Prueba",
  consumerEmail: "persona@ejemplo.test", description: `Descripción ${id}`, status, adminNote: null,
  createdAt: "2026-11-20T10:00:00+00:00", resolvedAt: null,
  secondsToFirstReview: null, secondsToClosure: null, ...extra,
});
const change = (previousStatus, newStatus, changedAt) =>
  ({ previousStatus, newStatus, changedAt, adminId: 1, adminEmail: "admin@ejemplo.test" });

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  i18n.global.locale.value = "es";
  route.query = {};
});

describe("US36 - Estados y tiempos", () => {
  it.each([
    ["registered", ["in_review", "resolved", "rejected"]],
    ["in_review", ["in_review", "resolved", "rejected"]],
    ["resolved", []],
    ["rejected", []],
  ])("testEstados_Desde %s", (status, next) => {
    expect(nextStatuses(status)).toEqual(next);
    expect(isClosed(status)).toBe(next.length === 0);
  });

  it.each([
    [0, "< 1 min"], [59, "< 1 min"], [60, "1 min"], [3599, "59 min"],
    [3600, "1 h 0 min"], [11700, "3 h 15 min"], [86400, "1 d 0 h"], [183600, "2 d 3 h"],
  ])("testDuracion_%s segundos", (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });

  it("testDuracion_SinDato", () => {
    for (const value of [null, undefined, -1, Number.NaN]) expect(formatDuration(value)).toBeNull();
  });

  it("testFechas_SinZonaSonUtc", () => {
    expect(parseApiDate("2026-11-20T10:00:00").toISOString()).toBe("2026-11-20T10:00:00.000Z");
    expect(parseApiDate("2026-11-20T05:00:00-05:00").toISOString()).toBe("2026-11-20T10:00:00.000Z");
    expect(parseApiDate("2026-11-20T10:00:00.1234567Z")).not.toBeNull();
    expect(parseApiDate("ayer")).toBeNull();
    expect(parseApiDate(null)).toBeNull();
  });

  it("testTiempos_PrimeraRevisionEsElPrimerCambioDesdeRegistrado", () => {
    const history = [
      change("registered", "in_review", "2026-11-20T12:00:00Z"),
      change("in_review", "resolved", "2026-11-21T10:00:00Z"),
    ];

    expect(secondsToFirstReview("2026-11-20T10:00:00Z", history)).toBe(7200);
    expect(secondsToFirstReview("2026-11-20T10:00:00Z", [])).toBeNull();
  });

  it("testTiempos_CierreSoloEnReclamosCerrados", () => {
    const dates = { createdAt: "2026-11-20T10:00:00+00:00", resolvedAt: "2026-11-20T11:30:00" };

    expect(secondsToClosure({ status: "resolved", ...dates })).toBe(5400);
    expect(secondsToClosure({ status: "in_review", ...dates })).toBeNull();
  });
});

describe("US36 - Panel del administrador", () => {
  let claims;
  let summaryResponse;
  const history = {
    2: [change("registered", "in_review", "2026-11-20T12:00:00Z")],
    3: [
      change("registered", "in_review", "2026-11-20T11:00:00Z"),
      change("in_review", "resolved", "2026-11-22T13:00:00Z"),
    ],
  };
  const summary = (extra = {}) => ({
    from: null, to: null, total: 4, byStatus: { registered: 1, in_review: 1, resolved: 1, rejected: 1 },
    closedClaims: 2, averageResolutionSeconds: 183600, ...extra,
  });
  const calls = (url) => get.mock.calls.filter(([called]) => called === url);

  beforeEach(() => {
    claims = [
      claim(1, "registered"),
      claim(2, "in_review", { adminNote: "Revisando el caso" }),
      claim(3, "resolved", { adminNote: "Atendido", secondsToFirstReview: 3600, secondsToClosure: 183600 }),
      claim(4, "rejected", { secondsToClosure: 600 }),
    ];
    summaryResponse = () => Promise.resolve({ data: summary() });
    get.mockImplementation((url) => {
      if (url === "/claims/summary") return summaryResponse();
      const match = /^\/claims\/(\d+)\/history$/.exec(url);
      return Promise.resolve({ data: match ? history[match[1]] ?? [] : claims });
    });
    patch.mockResolvedValue({ data: {} });
  });

  async function mountView(tab) {
    const wrapper = mount(AdminClaimsView, { global: { plugins: [i18n] } });
    await flushPromises();
    if (tab) await wrapper.find(`[data-test="tab-${tab}"]`).trigger("click");
    await flushPromises();
    return wrapper;
  }

  const text = (wrapper, id) => wrapper.find(`[data-test="${id}"]`).text();

  it("testResumen_CantidadesPorEstadoYPromedio", async () => {
    const wrapper = await mountView();

    expect(text(wrapper, "summary-total")).toContain("4");
    for (const status of ["registered", "in_review", "resolved", "rejected"]) {
      expect(text(wrapper, `summary-${status}`)).toMatch(/1$/);
    }
    expect(text(wrapper, "summary-average")).toContain("2 d 3 h");
    expect(get).toHaveBeenCalledWith("/claims/summary", { params: { from: undefined, to: undefined } });
  });

  it("testResumen_FiltraPorPeriodo", async () => {
    const wrapper = await mountView();
    await wrapper.find('[data-test="summary-from"]').setValue("2026-11-01");
    await wrapper.find('[data-test="summary-to"]').setValue("2026-11-30");

    await wrapper.find(".summary-form").trigger("submit");
    await flushPromises();

    expect(get).toHaveBeenLastCalledWith("/claims/summary", { params: { from: "2026-11-01", to: "2026-11-30" } });
  });

  it("testResumen_RangoInvertidoNoConsulta", async () => {
    const wrapper = await mountView();
    await wrapper.find('[data-test="summary-from"]').setValue("2026-11-30");
    await wrapper.find('[data-test="summary-to"]').setValue("2026-11-01");

    await wrapper.find(".summary-form").trigger("submit");

    expect(wrapper.find(".summary-error").text()).toBe("La fecha inicial no puede ser posterior a la final.");
    expect(calls("/claims/summary")).toHaveLength(1);
  });

  it("testResumen_SinCerradosNoMuestraPromedio", async () => {
    summaryResponse = () => Promise.resolve({ data: summary({ closedClaims: 0, averageResolutionSeconds: null }) });

    const wrapper = await mountView();

    expect(text(wrapper, "summary-average")).toContain("Sin reclamos cerrados");
  });

  it("testResumen_ErrorDelApi", async () => {
    summaryResponse = () => Promise.reject({ response: { status: 400, data: { error: "Fecha no válida" } } });

    const wrapper = await mountView();

    expect(wrapper.find(".summary-error").text()).toBe("Fecha no válida");
  });

  it("testRegistrado_FechaYTiemposPendientesSinPedirHistorial", async () => {
    const wrapper = await mountView();

    expect(wrapper.find(".claim-card").text()).toContain("Registrado: 20");
    expect(text(wrapper, "to-first-review")).toBe("Pendiente");
    expect(text(wrapper, "to-closure")).toBe("Pendiente");
    expect(get.mock.calls.some(([url]) => url.endsWith("/history"))).toBe(false);
    expect(wrapper.findAll(".status-select option").map((o) => o.attributes("value")))
      .toEqual(["in_review", "resolved", "rejected"]);
  });

  it("testEnRevision_PrimeraRevisionSaleDelHistorial", async () => {
    const wrapper = await mountView("in_review");

    expect(text(wrapper, "to-first-review")).toBe("2 h 0 min");
    expect(text(wrapper, "to-closure")).toBe("Pendiente");
    expect(wrapper.find(".status-select option").text()).toBe("En revisión (actualizar nota)");
    expect(wrapper.find("textarea").element.value).toBe("Revisando el caso");
  });

  it.each(["resolved", "rejected"])("testCerrado_%s no ofrece cambiar el estado", async (status) => {
    const wrapper = await mountView(status);

    expect(wrapper.find(".status-select").exists()).toBe(false);
    expect(wrapper.find("textarea").exists()).toBe(false);
    expect(wrapper.find(".action-buttons").exists()).toBe(false);
    expect(text(wrapper, "closed-note")).toBe("Reclamo cerrado: no admite más cambios.");
  });

  it("testCerrado_TiemposDelRecursoEHistorialConResponsable", async () => {
    const wrapper = await mountView("resolved");
    expect(text(wrapper, "to-first-review")).toBe("1 h 0 min");
    expect(text(wrapper, "to-closure")).toBe("2 d 3 h");
    expect(wrapper.text()).toContain("Atendido");

    await wrapper.find('[data-test="toggle-history"]').trigger("click");
    await flushPromises();

    const items = wrapper.findAll(".history-item");
    expect(items).toHaveLength(2);
    expect(items[0].find(".history-change").text()).toBe("Registrado → En revisión");
    expect(items[1].find(".history-meta").text()).toContain("admin@ejemplo.test");
    expect(items[1].find(".history-meta").text()).toContain("22");
  });

  it("testCerrado_AnteriorAlHistorialQuedaSinDato", async () => {
    const wrapper = await mountView("rejected");

    expect(text(wrapper, "to-first-review")).toBe("Sin dato");
    expect(text(wrapper, "to-closure")).toBe("10 min");
    await wrapper.find('[data-test="toggle-history"]').trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("No hay cambios de estado registrados.");
  });

  it("testActualizar_ConservaLaNotaYRecargaListaYResumen", async () => {
    const wrapper = await mountView("in_review");

    await wrapper.find(".action-buttons button").trigger("click");
    await flushPromises();

    expect(patch).toHaveBeenCalledWith("/claims/2/review", { status: "in_review", note: "Revisando el caso" });
    expect(calls("/claims")).toHaveLength(2);
    expect(calls("/claims/summary")).toHaveLength(2);
  });

  it("testActualizar_AvisaQueCerrarEsDefinitivo", async () => {
    const wrapper = await mountView();
    expect(wrapper.find(".final-warning").exists()).toBe(false);

    await wrapper.find(".status-select").setValue("resolved");

    expect(wrapper.find(".final-warning").exists()).toBe(true);
  });

  it("testActualizar_SiYaEstabaCerradoRecargaYQuitaLosControles", async () => {
    patch.mockImplementation(async () => {
      claims = [claim(1, "resolved")];
      throw { response: { status: 400, data: { error: "El reclamo ya está cerrado" } } };
    });
    const wrapper = await mountView();

    await wrapper.find(".action-buttons button").trigger("click");
    await flushPromises();
    await wrapper.find('[data-test="tab-all"]').trigger("click");

    expect(wrapper.find(".status-select").exists()).toBe(false);
  });
});

describe("US36 - Seguimiento público", () => {
  async function track(data) {
    route.query = { code: "RC-2026-000001" };
    get.mockResolvedValue({ data });
    const wrapper = mount(ClaimTrackView, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
    await flushPromises();
    return wrapper;
  }

  const open = { code: "RC-2026-000001", type: "queja", status: "in_review", createdAt: "2026-11-20T10:00:00+00:00", resolvedAt: null, adminNote: null };

  it("testSeguimiento_CerradoConFechasYTiempoHastaElCierre", async () => {
    const wrapper = await track({ ...open, status: "resolved", resolvedAt: "2026-11-22T13:00:00", adminNote: "Atendido" });

    expect(wrapper.find('[data-test="registered"]').text()).toContain("20");
    expect(wrapper.find('[data-test="closed-on"]').text()).toContain("22");
    expect(wrapper.find('[data-test="to-closure"]').text()).toBe("2 d 3 h");
    expect(wrapper.text()).toContain("Atendido");
  });

  it("testSeguimiento_AbiertoSinCierreNiLlamadasDeAdministrador", async () => {
    const wrapper = await track(open);

    expect(wrapper.find('[data-test="closed-on"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("El reclamo sigue abierto.");
    expect(get.mock.calls).toEqual([["/claims/track/RC-2026-000001"]]);
  });

  it("testSeguimiento_EnIngles", async () => {
    i18n.global.locale.value = "en";

    const wrapper = await track(open);

    expect(wrapper.text()).toContain("In review");
    expect(wrapper.text()).toContain("Complaint");
  });

  it("testSeguimiento_CodigoInexistente", async () => {
    route.query = { code: "RC-0" };
    get.mockRejectedValue({ response: { status: 404 } });
    const wrapper = mount(ClaimTrackView, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
    await flushPromises();

    expect(wrapper.find(".error-box").text()).toBe("No encontramos un reclamo con ese código");
  });
});
