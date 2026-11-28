/**
 * US32 — distrito base y radio de atención. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

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
import { DISTRICTS, districtName } from "../src/Shared/domain/constants/districts.js";
import { ZONES } from "../src/Shared/domain/constants/zones.js";
import { DistrictStorage } from "../src/Shared/infrastructure/storage/district.storage.js";
import { isValidRadius } from "../src/Profiles/domain/model/service-area.value.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import WorkerProfileEditView from "../src/Profiles/presentation/views/WorkerProfileEditView.vue";
import WorkerProfileView from "../src/SearchAndCatalog/presentation/views/WorkerProfileView.vue";

const profile = {
  id: 3, name: "Alex Prueba", phone: "900000000", age: 30, experienceYears: 4, hourlyRate: 20,
  serviceTypes: ["limpieza_general"], zones: ["miraflores"], bio: "", averageRating: 4, totalServices: 1,
};
const enabled = { experiments: [{ id: "EC-BLQ01-SA", enabled: true, treatmentPercent: 100 }] };
const failure = (status, data = {}) => Promise.reject({ response: { status, data } });

let config;
let areaResponse;
let detail;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  i18n.global.locale.value = "es";
  config = enabled;
  areaResponse = () => Promise.resolve({ data: { district: "surquillo", radiusKm: 6 } });
  detail = () => ({ ...profile, serviceDistrict: null, approxDistanceKm: null });
  get.mockImplementation((url, options) => {
    if (url === "/workers/me/service-area") return areaResponse();
    const data = {
      "/experiments/config": config,
      "/workers/me/profile": profile,
      "/workers/3": detail(options?.params?.district),
      "/workers/3/availability": [],
      "/reviews/worker/3": [],
    }[url];
    return Promise.resolve({ data });
  });
  put.mockImplementation((_, body) => Promise.resolve({ data: body }));
});

async function mountView(component) {
  await useExperimentStore().load(); // en la app lo pide main.js al iniciar
  const wrapper = mount(component, { global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: true } } });
  await flushPromises();
  return wrapper;
}

const card = (wrapper) => wrapper.find('[data-test="service-area"]');
const district = (wrapper) => wrapper.find("#service-district");
const radius = (wrapper) => wrapper.find("#service-radius");

async function submit(wrapper) {
  await card(wrapper).find("form").trigger("submit");
  await flushPromises();
}

describe("US32 - Dominio", () => {
  it("testDistritos_LimaYCallaoSinRepetidos", () => {
    const keys = DISTRICTS.map((d) => d.key);

    expect(keys).toHaveLength(50);
    expect(new Set(keys).size).toBe(50);
    expect(keys).toEqual(expect.arrayContaining([...ZONES]));
    expect(districtName("jesus_maria")).toBe("Jesús María");
    expect(districtName("otro")).toBe("otro");
  });

  it.each([[1, true], [15, true], ["8", true], [0, false], [16, false], [2.5, false], ["", false], [" ", false],
    [null, false], ["abc", false]])("testRadio %j", (value, valid) => {
    expect(isValidRadius(value)).toBe(valid);
  });

  it("testDistritoDelCliente_SoloClavesConocidas", () => {
    DistrictStorage.set(1, "lince");
    DistrictStorage.set(1, "no_existe");
    localStorage.setItem("inclean_district.2", "manipulado");

    expect(DistrictStorage.get(1)).toBe("lince");
    expect(DistrictStorage.get(2)).toBe("");
  });
});

describe("US32 - Formulario del prestador/a", () => {
  beforeEach(() => useAuthStore().updateUser({ id: 3, role: "worker", name: "Alex Prueba" }));

  it("testCarga_MuestraElAreaGuardada", async () => {
    const wrapper = await mountView(WorkerProfileEditView);

    expect(district(wrapper).element.value).toBe("surquillo");
    expect(radius(wrapper).element.value).toBe("6");
    expect(district(wrapper).findAll("option")).toHaveLength(51);
    expect(wrapper.find('[data-test="service-area-empty"]').exists()).toBe(false);
  });

  it("testCarga_SinAreaMuestraElFormularioVacio", async () => {
    areaResponse = () => failure(404, { error: "Todavía no registraste tu área de atención" });

    const wrapper = await mountView(WorkerProfileEditView);

    expect(wrapper.find('[data-test="service-area-empty"]').exists()).toBe(true);
    expect(district(wrapper).element.value).toBe("");
    expect(radius(wrapper).element.value).toBe("");
  });

  // Escenario 1: registro de ubicación y radio
  it("testGuardar_EnviaDistritoYRadio", async () => {
    areaResponse = () => failure(404);
    const wrapper = await mountView(WorkerProfileEditView);

    await district(wrapper).setValue("jesus_maria");
    await radius(wrapper).setValue("5");
    await submit(wrapper);

    expect(put).toHaveBeenCalledWith("/workers/me/service-area", { district: "jesus_maria", radiusKm: 5 });
    expect(card(wrapper).text()).toContain("Área de atención guardada.");
    expect(wrapper.find('[data-test="service-area-empty"]').exists()).toBe(false);
    // El plan de tracking no define eventos para esta historia
    expect(TrackingStorage.getOutbox()).toEqual([]);
  });

  // Escenario 2: radio fuera de rango
  it.each(["0", "16", "2.5", ""])("testRadioFueraDeRango '%s' no se envía y comunica el rango", async (value) => {
    const wrapper = await mountView(WorkerProfileEditView);

    await radius(wrapper).setValue(value);
    await submit(wrapper);

    expect(card(wrapper).text()).toContain("El radio debe ser un número entero entre 1 y 15 km.");
    expect(put).not.toHaveBeenCalled();
  });

  it("testSinDistrito_NoSeEnvia", async () => {
    areaResponse = () => failure(404);
    const wrapper = await mountView(WorkerProfileEditView);

    await radius(wrapper).setValue("5");
    await submit(wrapper);

    expect(card(wrapper).text()).toContain("Selecciona un distrito.");
    expect(put).not.toHaveBeenCalled();
  });

  it("testRangoDelServidor_SeMuestraSuMensaje", async () => {
    put.mockImplementation(() => failure(400, { error: "El radio debe estar entre 1 y 10 km" }));
    const wrapper = await mountView(WorkerProfileEditView);

    await radius(wrapper).setValue("12");
    await submit(wrapper);

    expect(card(wrapper).text()).toContain("El radio debe estar entre 1 y 10 km");
    expect(card(wrapper).text()).not.toContain("Área de atención guardada.");
    expect(radius(wrapper).element.value).toBe("12");
  });

  it("testDistritoRechazado_MensajeTraducido", async () => {
    put.mockImplementation(() => failure(400, { error: "Distrito no reconocido", validDistricts: ["ate"] }));
    const wrapper = await mountView(WorkerProfileEditView);

    await submit(wrapper);

    expect(card(wrapper).text()).toContain("El distrito seleccionado no está disponible.");
  });

  it.each([["al cargar", true], ["al guardar", false]])("testSinPermiso_403 %s oculta la tarjeta", async (_, onLoad) => {
    if (onLoad) areaResponse = () => failure(403);
    else put.mockImplementation(() => failure(403));
    const wrapper = await mountView(WorkerProfileEditView);

    if (!onLoad) await submit(wrapper);

    expect(card(wrapper).exists()).toBe(false);
    expect(wrapper.find(".profile-card").exists()).toBe(true);
  });

  it("testCarga_ErrorConReintento", async () => {
    let calls = 0;
    areaResponse = () => (calls++ === 0 ? failure(500) : Promise.resolve({ data: { district: "ate", radiusKm: 3 } }));
    const wrapper = await mountView(WorkerProfileEditView);

    expect(card(wrapper).text()).toContain("No pudimos cargar tu área de atención.");
    expect(card(wrapper).find("form").exists()).toBe(false);
    await wrapper.find('[data-test="service-area-retry"]').trigger("click");
    await flushPromises();

    expect(district(wrapper).element.value).toBe("ate");
  });

  it("testTextosEnIngles", async () => {
    i18n.global.locale.value = "en";
    const wrapper = await mountView(WorkerProfileEditView);

    await radius(wrapper).setValue("20");
    await submit(wrapper);

    expect(card(wrapper).text()).toContain("Service area");
    expect(card(wrapper).text()).toContain("The radius must be a whole number from 1 to 15 km.");
  });

  it("testFlag_ApagadoNoConsultaElArea", async () => {
    config = { experiments: [{ id: "EC-BLQ01-SA", enabled: false, treatmentPercent: 100 }] };

    const wrapper = await mountView(WorkerProfileEditView);

    expect(card(wrapper).exists()).toBe(false);
    expect(get.mock.calls.map(([url]) => url)).not.toContain("/workers/me/service-area");
  });
});

describe("US32 - Perfil que consulta el cliente", () => {
  const rows = (wrapper) => wrapper.find(".worker-location");
  const profileCalls = () => get.mock.calls.filter(([url]) => url === "/workers/3");

  beforeEach(() => {
    useAuthStore().updateUser({ id: 1, role: "client" });
    detail = (clientDistrict) => ({
      ...profile, serviceDistrict: "miraflores",
      approxDistanceKm: clientDistrict ? { miraflores: 0, san_isidro: 2.5 }[clientDistrict] ?? 9.1 : null,
    });
  });

  // Escenario 3: solo distrito y distancia aproximada
  it("testPerfil_MuestraElDistritoSinDistanciaSiNoSeConoceElDelCliente", async () => {
    const wrapper = await mountView(WorkerProfileView);

    expect(rows(wrapper).text()).toContain("Distrito base: Miraflores");
    expect(wrapper.find('[data-test="approx-distance"]').exists()).toBe(false);
    expect(profileCalls()).toEqual([["/workers/3"]]);
  });

  it("testPerfil_AlElegirSuDistritoPideYMuestraLaDistancia", async () => {
    const wrapper = await mountView(WorkerProfileView);

    await wrapper.find('[data-test="client-district"]').setValue("san_isidro");
    await flushPromises();

    expect(wrapper.find('[data-test="approx-distance"]').text()).toBe("A 2.5 km de tu distrito, aproximadamente");
    expect(profileCalls().at(-1)).toEqual(["/workers/3", { params: { district: "san_isidro" } }]);
    expect(DistrictStorage.get(1)).toBe("san_isidro");
  });

  it("testPerfil_UsaElDistritoRecordado", async () => {
    DistrictStorage.set(1, "miraflores");

    const wrapper = await mountView(WorkerProfileView);

    expect(wrapper.find('[data-test="approx-distance"]').text()).toBe("Atiende desde tu mismo distrito");
    expect(wrapper.find('[data-test="client-district"]').element.value).toBe("miraflores");
  });

  it("testPerfil_SinAreaNoMuestraNada", async () => {
    detail = () => ({ ...profile });

    const wrapper = await mountView(WorkerProfileView);

    expect(rows(wrapper).exists()).toBe(false);
    expect(wrapper.text()).toContain("Alex Prueba");
  });

  it("testPerfil_TextosEnIngles", async () => {
    i18n.global.locale.value = "en";
    DistrictStorage.set(1, "san_isidro");

    const wrapper = await mountView(WorkerProfileView);

    expect(rows(wrapper).text()).toContain("Base district: Miraflores");
    expect(rows(wrapper).text()).toContain("About 2.5 km from your district");
  });
});
