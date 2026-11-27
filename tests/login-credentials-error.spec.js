/**
 * US39 — el error de credenciales del inicio de sesión se muestra en el idioma de la interfaz.
 * El API se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { post: (...a) => post(...a), get: vi.fn(), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import LoginView from "../src/IAM/presentation/views/LoginView.vue";
import TwoFactorVerifyView from "../src/IAM/presentation/views/TwoFactorVerifyView.vue";

// Respuesta real del API ante un correo o una contraseña incorrectos
const wrongCredentials = { response: { status: 401, data: { error: "Invalid email or password" }, headers: {} } };

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  i18n.global.locale.value = "es";
  post.mockRejectedValue(wrongCredentials);
});

async function signIn() {
  const wrapper = mount(LoginView, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
  await wrapper.find('input[type="email"]').setValue("persona@ejemplo.test");
  await wrapper.find('input[type="password"]').setValue("clave-de-prueba");
  await wrapper.find("form").trigger("submit");
  await flushPromises();
  return wrapper;
}

describe("US39 - Credenciales incorrectas", () => {
  it.each([
    ["es", "Correo o contraseña incorrectos."],
    ["en", "Incorrect email or password."],
  ])("testCredenciales_Traducidas %s", async (locale, message) => {
    i18n.global.locale.value = locale;

    const wrapper = await signIn();

    expect(wrapper.find(".error-box").text()).toBe(message);
  });

  it("testOtraPantalla_ConservaElMensajeDelApi", async () => {
    // En la verificación 2FA un 401 significa otra cosa: el paso de acceso caducó.
    post.mockRejectedValue({ response: { status: 401, data: { error: "Reto vencido" }, headers: {} } });
    useAuthStore().challengeToken = "reto";
    const wrapper = mount(TwoFactorVerifyView, { global: { plugins: [i18n] } });
    await wrapper.find("input").setValue("123456");

    await wrapper.find(".submit-btn").trigger("click");
    await flushPromises();

    expect(wrapper.find(".error-box").text()).toBe("Reto vencido");
  });
});
