/**
 * US38 — soluciones a problemas frecuentes antes de un reclamo. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises, RouterLinkStub } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { query: {} };
const replace = vi.fn();
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ replace, push: vi.fn() }) }));

const get = vi.fn();
const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import { FAQ_CATEGORIES, FAQ_ITEMS, faqByCategory } from "../src/Support/domain/model/faq.catalog.js";
import SupportView from "../src/Support/presentation/views/SupportView.vue";
import ClaimsBookView from "../src/Claims/presentation/views/ClaimsBookView.vue";

const on = { experiments: [{ id: "EC-BLQ04", enabled: true, treatmentPercent: 0 }] };
const off = { experiments: [{ id: "EC-BLQ04", enabled: false, treatmentPercent: 100 }] };

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  i18n.global.locale.value = "es";
  route.query = {};
  get.mockResolvedValue({ data: on });
});

async function mountView(component) {
  const wrapper = mount(component, { global: { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } } });
  await flushPromises();
  return wrapper;
}

const events = (name) => TrackingStorage.getOutbox().filter((e) => !name || e.eventName === name);
const faq = (wrapper, id) => wrapper.find(`[data-test="${id}"]`);
const open = (wrapper, id) => faq(wrapper, id).find(".faq-question").trigger("click");
const linkTo = (wrapper, selector) => wrapper.findAllComponents(RouterLinkStub)
  .find((link) => link.element.matches(selector))?.props("to");

describe("US38 - Catálogo", () => {
  it("testCatalogo_IdentificadoresDeLaAppMovil", () => {
    expect(FAQ_CATEGORIES).toEqual(["bookings", "account_access", "workers", "memberships"]);
    expect(FAQ_ITEMS.map((item) => item.id)).toEqual([
      "bookings-amount", "bookings-cancel", "bookings-review", "account-code", "account-attempts",
      "workers-contact", "workers-verified", "memberships-pending",
    ]);
    for (const category of FAQ_CATEGORIES) expect(faqByCategory(category).length).toBeGreaterThan(0);
  });

  it.each(["es", "en"])("testTextos_Completos en %s", (locale) => {
    for (const category of FAQ_CATEGORIES) {
      expect(i18n.global.te(`support.categories.${category}`, locale)).toBe(true);
    }
    for (const { id } of FAQ_ITEMS) {
      expect(i18n.global.te(`support.items.${id}.question`, locale), id).toBe(true);
      expect(i18n.global.te(`support.items.${id}.answer`, locale), id).toBe(true);
    }
  });
});

describe("US38 - Vista de ayuda", () => {
  // US38 - Escenario 1: respuestas por categoría
  it("testAyuda_MuestraPreguntasPorCategoria", async () => {
    const wrapper = await mountView(SupportView);
    expect(wrapper.findAll(".faq")).toHaveLength(3);

    await faq(wrapper, "category-account_access").trigger("click");

    expect(wrapper.findAll(".faq")).toHaveLength(2);
    expect(wrapper.text()).toContain("Mi código de verificación es rechazado");
    expect(wrapper.find(".faq-answer").exists()).toBe(false);
  });

  it("testAyuda_AbrirRegistraFaqVistaUnaVezPorVisita", async () => {
    const wrapper = await mountView(SupportView);

    await open(wrapper, "bookings-cancel");
    await open(wrapper, "bookings-cancel"); // cierra
    await open(wrapper, "bookings-cancel");

    expect(faq(wrapper, "bookings-cancel").find(".faq-answer").text()).toContain("Cancelar");
    const viewed = events("faq_viewed");
    expect(viewed).toHaveLength(1);
    expect(viewed[0].properties).toEqual({ category: "bookings", faqId: "bookings-cancel" });
    expect(viewed[0]).toMatchObject({ experimentId: "EC-BLQ04", featureActive: true, userRole: null });
    expect(viewed[0].userRef).toMatch(/^anonymous:/);
  });

  // US38 - Escenario 2: resuelta sin crear reclamo
  it("testResuelta_RegistraSinCrearReclamo", async () => {
    useAuthStore().updateUser({ id: 7, role: "client" });
    const wrapper = await mountView(SupportView);
    await open(wrapper, "bookings-amount");

    await wrapper.find('[data-test="solved"]').trigger("click");

    expect(wrapper.find(".faq-thanks").text()).toBe("Listo, registramos que tu problema se resolvió.");
    expect(wrapper.find('[data-test="solved"]').exists()).toBe(false);
    const [resolved] = events("faq_resolved");
    expect(resolved.properties).toEqual({ category: "bookings", faqId: "bookings-amount" });
    expect(resolved.userRole).toBe("client");
    expect(post.mock.calls.filter(([url]) => url === "/claims")).toEqual([]);
    expect(events("experiment_exposure")).toEqual([]); // no es una prueba A/B
  });

  // US38 - Escenario 3: no resuelta → reclamo con la categoría
  it("testNoResuelta_LlevaAlReclamoConLaCategoria", async () => {
    const wrapper = await mountView(SupportView);
    await faq(wrapper, "category-workers").trigger("click");
    await open(wrapper, "workers-contact");

    expect(linkTo(wrapper, '[data-test="not-solved"]')).toEqual({ path: "/reclamos", query: { categoria: "workers" } });
    expect(events("faq_resolved")).toEqual([]);
  });

  // US38 - Escenario 4: acceso directo
  it("testAccesoDirecto_SiempreDisponible", async () => {
    const wrapper = await mountView(SupportView);

    expect(linkTo(wrapper, '[data-test="direct-claim"]')).toBe("/reclamos");
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([
    ["apagado", () => get.mockResolvedValue({ data: off })],
    ["sin respuesta del API", () => get.mockRejectedValue(new Error("network"))],
  ])("testFlag_%s lleva al Libro de Reclamaciones", async (_, arrange) => {
    arrange();

    const wrapper = await mountView(SupportView);

    expect(replace).toHaveBeenCalledWith("/reclamos");
    expect(wrapper.find(".faq").exists()).toBe(false);
    expect(events()).toEqual([]);
  });
});

describe("US38 - Libro de Reclamaciones", () => {
  async function mountBook(config = on) {
    get.mockResolvedValue({ data: config });
    const { useExperimentStore } = await import("../src/Experiments/application/experiment.store.js");
    await useExperimentStore().load();
    return mountView(ClaimsBookView);
  }
  const relatedService = (wrapper) => wrapper.find('input[placeholder^="Ej."]').element.value;

  it("testEntrada_ConElExperimentoActivo", async () => {
    const wrapper = await mountBook();

    expect(faq(wrapper, "help-entry").text()).toContain("Antes de registrar un reclamo");
    expect(linkTo(wrapper, ".help-entry a")).toBe("/ayuda");
    expect(relatedService(wrapper)).toBe("");
  });

  it("testEntrada_ApagadaSinCambios", async () => {
    const wrapper = await mountBook(off);

    expect(faq(wrapper, "help-entry").exists()).toBe(false);
    expect(wrapper.find("form").exists()).toBe(true);
  });

  it("testReclamo_RecibeLaCategoriaElegida", async () => {
    route.query = { categoria: "account_access" };

    const wrapper = await mountBook();

    expect(relatedService(wrapper)).toBe("Cuenta y acceso");
    expect(faq(wrapper, "help-entry").exists()).toBe(false);
  });

  it("testReclamo_IgnoraUnaCategoriaDesconocida", async () => {
    route.query = { categoria: "<script>" };

    const wrapper = await mountBook();

    expect(relatedService(wrapper)).toBe("");
  });
});
