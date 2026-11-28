/**
 * US37 — textos sobre el aviso de avance de un reclamo. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises, RouterLinkStub } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

vi.mock("vue-router", () => ({ useRoute: () => ({ query: {} }), useRouter: () => ({ push: vi.fn() }) }));

const get = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: vi.fn(), patch: vi.fn(), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import ClaimsBookView from "../src/Claims/presentation/views/ClaimsBookView.vue";
import AdminClaimsView from "../src/Claims/presentation/views/AdminClaimsView.vue";

const claim = (id, status, consumerEmail = "persona@ejemplo.test") => ({
  id, code: `RC-2026-00000${id}`, type: "reclamo", consumerName: "Persona Prueba", consumerEmail,
  description: `Descripción ${id}`, status, adminNote: null,
  createdAt: "2026-11-20T10:00:00+00:00", resolvedAt: null,
});
let claims = [];

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  i18n.global.locale.value = "es";
  get.mockImplementation((url) => Promise.resolve({
    data: url === "/claims" ? claims
      : url === "/claims/summary" ? { total: 0, byStatus: {}, closedClaims: 0, averageResolutionSeconds: null }
        : { experiments: [] },
  }));
});

async function mountView(component) {
  const wrapper = mount(component, { global: { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } } });
  await flushPromises();
  return wrapper;
}

describe("US37 - Formulario del Libro de Reclamaciones", () => {
  it.each([
    ["es", "te enviaremos un aviso de avance por correo mediante un proveedor externo", "¿Ya tienes un código?"],
    ["en", "we will email you a progress notice through an external provider", "Already have a code?"],
  ])("testFormulario_%s avisa del envío por un proveedor externo", async (locale, notice, link) => {
    i18n.global.locale.value = locale;

    const wrapper = await mountView(ClaimsBookView);

    const subtitle = wrapper.find('[data-test="claim-subtitle"]');
    expect(subtitle.text()).toContain(notice);
    expect(subtitle.findComponent(RouterLinkStub).text()).toBe(link);
    expect(subtitle.findComponent(RouterLinkStub).props("to")).toBe("/reclamos/seguimiento");
    expect(wrapper.text()).not.toMatch(/no se envía a\s+terceros/);
  });
});

describe("US37 - Panel del administrador", () => {
  it.each([
    ["es", "La nota de revisión se envía por correo al reclamante cuando cambias el estado del reclamo."],
    ["en", "The review note is emailed to the claimant when you change the claim status."],
  ])("testNota_%s aclara que se envía por correo", async (locale, hint) => {
    i18n.global.locale.value = locale;
    claims = [claim(1, "registered")];

    const wrapper = await mountView(AdminClaimsView);

    const shown = wrapper.find('[data-test="note-hint"]');
    expect(shown.text()).toBe(hint);
    expect(wrapper.find("textarea").attributes("aria-describedby")).toBe(shown.attributes("id"));
  });

  it("testNota_SinCorreoNoPrometeUnEnvio", async () => {
    claims = [claim(1, "registered", "")];

    const wrapper = await mountView(AdminClaimsView);

    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(wrapper.find('[data-test="note-hint"]').exists()).toBe(false);
    expect(wrapper.find("textarea").attributes("aria-describedby")).toBeUndefined();
  });

  it("testNota_ReclamoCerradoSinAviso", async () => {
    claims = [claim(1, "resolved")];
    const wrapper = await mountView(AdminClaimsView);

    await wrapper.find('[data-test="tab-all"]').trigger("click");

    expect(wrapper.find('[data-test="closed-note"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="note-hint"]').exists()).toBe(false);
  });
});
