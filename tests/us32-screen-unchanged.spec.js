/**
 * US32 — con EC-BLQ01-SA apagado las pantallas no cambian. Las capturas se generaron antes
 * de implementar la historia. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { screenMarkup } from "./support/screen.js";

const route = { params: { id: "3" }, query: {} };
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

const get = vi.fn();
const put = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), put: (...a) => put(...a), post: vi.fn(), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { useExperimentStore } from "../src/Experiments/application/experiment.store.js";
import WorkerProfileEditView from "../src/Profiles/presentation/views/WorkerProfileEditView.vue";
import WorkerProfileView from "../src/SearchAndCatalog/presentation/views/WorkerProfileView.vue";

const profile = {
  id: 3, name: "Alex Prueba", phone: "900000000", age: 30, experienceYears: 4, hourlyRate: 20,
  serviceTypes: ["limpieza_general"], zones: ["miraflores"], bio: "Perfil de prueba",
  gender: "female", averageRating: 4, totalServices: 1,
};

async function mountView(component, config) {
  get.mockImplementation(async (url) => ({
    data: {
      "/experiments/config": config,
      "/workers/me/profile": profile,
      // Con la funcionalidad apagada el API envía ambos campos en null.
      "/workers/3": { ...profile, serviceDistrict: null, approxDistanceKm: null },
      "/workers/3/availability": [],
      "/reviews/worker/3": [],
    }[url],
  }));
  await useExperimentStore().load(); // en la app lo pide main.js al iniciar
  const wrapper = mount(component, {
    global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: true } },
  });
  await flushPromises();
  return wrapper;
}

const configs = [
  ["sin experimentos", { experiments: [] }],
  ["apagado", { experiments: [{ id: "EC-BLQ01-SA", enabled: false, treatmentPercent: 100 }] }],
];

describe("US32 - Pantallas sin cambios con EC-BLQ01-SA apagado", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    i18n.global.locale.value = "es";
  });

  it.each(configs)("testFlag_%s: edición del perfil del prestador/a", async (_, config) => {
    useAuthStore().updateUser({ id: 3, role: "worker", name: "Alex Prueba" });

    const wrapper = await mountView(WorkerProfileEditView, config);

    await expect(screenMarkup(wrapper)).toMatchFileSnapshot("./__snapshots__/us32-profile-edit.html");
    expect(get.mock.calls.map(([url]) => url)).not.toContain("/workers/me/service-area");
    expect(put).not.toHaveBeenCalled();
  });

  it.each(configs)("testFlag_%s: perfil que consulta el cliente", async (_, config) => {
    useAuthStore().updateUser({ id: 1, role: "client" });

    const wrapper = await mountView(WorkerProfileView, config);

    await expect(screenMarkup(wrapper)).toMatchFileSnapshot("./__snapshots__/us32-worker-profile.html");
  });
});
