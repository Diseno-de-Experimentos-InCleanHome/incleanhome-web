/**
 * US43 — servicio de flags: carga, caché, valor por defecto y persistencia de la variante.
 * El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const get = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), defaults: { headers: { common: {} } } },
}));

import { useExperimentStore } from "../src/Experiments/application/experiment.store.js";
import { useExperiment } from "../src/Experiments/presentation/composables/useExperiment.js";
import { ExperimentId, Variant } from "../src/Experiments/domain/model/experiment.value.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";

const ID = ExperimentId.BOOKING_ESTIMATE;
const VARIANT_KEY = `inclean_variant.${ID}.1`;
const response = (enabled, treatmentPercent = 100) => ({
  data: { experiments: [{ id: ID, enabled, treatmentPercent }] },
});

/** Simula abrir la app de nuevo: Pinia nueva y el mismo localStorage. */
function freshApp(user = { id: 1, role: "client" }) {
  setActivePinia(createPinia());
  if (user) useAuthStore().setAuth(user, "token");
  return useExperimentStore();
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("US43 - Store de experimentos", () => {
  it("testStore_ConsultaElEndpointUnaSolaVez", async () => {
    get.mockResolvedValue(response(true));
    const store = freshApp();

    await Promise.all([store.load(), store.load()]);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toBe("/experiments/config");
    expect(store.isReady).toBe(true);
    expect(store.assignmentFor(ID).featureActive).toBe(true);
  });

  it("testStore_ApagadoPorDefectoSiElApiFalla", async () => {
    get.mockRejectedValue(new Error("network"));
    const store = freshApp();

    await store.load();

    expect(store.isReady).toBe(true);
    expect(store.assignmentFor(ID).inExperiment).toBe(false);
  });

  it("testStore_UsaLaCacheSiElApiFalla", async () => {
    get.mockResolvedValueOnce(response(true));
    await freshApp().load();
    get.mockRejectedValueOnce(new Error("503"));

    const store = freshApp();
    await store.load();

    expect(store.assignmentFor(ID).featureActive).toBe(true);
  });

  it("testStore_UnaRespuestaNoValidaNoBorraLaCache", async () => {
    get.mockResolvedValueOnce(response(true));
    await freshApp().load();
    get.mockResolvedValueOnce({ data: "<!DOCTYPE html>" });

    const store = freshApp();
    await store.load();

    expect(store.assignmentFor(ID).featureActive).toBe(true);
  });

  it("testStore_CacheDanadaDejaTodoApagado", async () => {
    localStorage.setItem("inclean_experiments_config", "{no es json");
    get.mockRejectedValue(new Error("network"));

    const store = freshApp();
    await store.load();

    expect(store.assignmentFor(ID).inExperiment).toBe(false);
  });

  // US43 - Escenario 2: conserva la asignación aunque cambie el porcentaje
  it("testStore_ConservaLaVarianteAunqueCambieElPorcentaje", async () => {
    get.mockResolvedValueOnce(response(true, 100));
    const first = freshApp();
    await first.load();
    expect(first.assignmentFor(ID).variant).toBe(Variant.TREATMENT);

    get.mockResolvedValueOnce(response(true, 0));
    const second = freshApp();
    await second.load();

    expect(second.assignmentFor(ID).variant).toBe(Variant.TREATMENT);
  });

  it("testStore_LaVarianteEsPorUsuario", async () => {
    localStorage.setItem(VARIANT_KEY, Variant.CONTROL);
    get.mockResolvedValue(response(true, 100));
    const store = freshApp({ id: 2, role: "client" });

    await store.load();

    expect(store.assignmentFor(ID).variant).toBe(Variant.TREATMENT);
    expect(localStorage.getItem(VARIANT_KEY)).toBe(Variant.CONTROL);
  });

  it("testStore_NoGuardaVarianteAntesDeTerminarLaCarga", () => {
    localStorage.setItem("inclean_experiments_config", JSON.stringify(response(true, 100).data));
    const store = freshApp();

    const result = store.assignmentFor(ID);

    expect(result.featureActive).toBe(true);
    expect(localStorage.getItem(VARIANT_KEY)).toBeNull();
  });

  // US43 - Escenario 4: desactivar restablece el comportamiento sin borrar datos
  it("testStore_DesactivarRestableceSinBorrarLaVariante", async () => {
    get.mockResolvedValueOnce(response(true, 100));
    const first = freshApp();
    await first.load();
    first.assignmentFor(ID);

    get.mockResolvedValueOnce(response(false, 100));
    const second = freshApp();
    await second.load();

    expect(second.assignmentFor(ID).featureActive).toBe(false);
    expect(localStorage.getItem(VARIANT_KEY)).toBe(Variant.TREATMENT);
  });
});

describe("US43 - Composable useExperiment", () => {
  const Probe = defineComponent({
    setup() {
      const { isActive, whenReady } = useExperiment(ID);
      whenReady();
      return () => h("p", isActive.value ? "nuevo" : "actual");
    },
  });

  it("testComposable_ActualizaLaVistaAlLlegarLaConfiguracion", async () => {
    let resolve;
    get.mockReturnValue(new Promise((r) => { resolve = r; }));
    freshApp();
    const wrapper = mount(Probe);
    expect(wrapper.text()).toBe("actual");

    resolve(response(true));
    await flushPromises();

    expect(wrapper.text()).toBe("nuevo");
  });

  it("testComposable_VuelveAlFlujoActualAlCerrarSesion", async () => {
    get.mockResolvedValue(response(true));
    freshApp();
    const wrapper = mount(Probe);
    await flushPromises();
    expect(wrapper.text()).toBe("nuevo");

    useAuthStore().clearAuth();
    await flushPromises();

    expect(wrapper.text()).toBe("actual");
  });
});
