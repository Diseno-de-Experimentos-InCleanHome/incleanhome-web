/**
 * US39 — mensaje de espera cuando el API limita los intentos de acceso. El API se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const push = vi.fn();
vi.mock("vue-router", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { post: (...a) => post(...a), get: vi.fn(), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { retryAfterSeconds } from "../src/IAM/domain/services/rate-limit.js";
import LoginView from "../src/IAM/presentation/views/LoginView.vue";
import TwoFactorVerifyView from "../src/IAM/presentation/views/TwoFactorVerifyView.vue";
import TwoFactorSetupView from "../src/IAM/presentation/views/TwoFactorSetupView.vue";

const failure = (status, data = {}, headers = {}) => ({ response: { status, data, headers } });
// Forma del cuerpo que envía el API
const tooMany = (seconds) => failure(429,
  { error: `Demasiados intentos. Vuelve a intentarlo en ${seconds} segundos.`, retryAfterSeconds: seconds },
  { "retry-after": String(seconds) });

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  i18n.global.locale.value = "es";
});

describe("US39 - Tiempo de espera", () => {
  it("testEspera_DelCuerpoODeLaCabecera", () => {
    expect(retryAfterSeconds(failure(429, { retryAfterSeconds: 42 }, { "retry-after": "60" }))).toBe(42);
    expect(retryAfterSeconds(failure(429, {}, { "retry-after": "60" }))).toBe(60);
    expect(retryAfterSeconds(failure(429, { retryAfterSeconds: 0.4 }))).toBe(1);
  });

  it.each([{}, { retryAfterSeconds: "pronto" }, { retryAfterSeconds: 0 }, ""])(
    "testEspera_SinDatoValido %j", (data) => {
      expect(retryAfterSeconds(failure(429, data))).toBeNull();
    });
});

const views = [
  ["inicio de sesión", async () => {
    const wrapper = mount(LoginView, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
    await wrapper.find('input[type="email"]').setValue("persona@ejemplo.test");
    await wrapper.find('input[type="password"]').setValue("clave-de-prueba");
    return { wrapper, submit: () => wrapper.find("form").trigger("submit") };
  }],
  ["verificación 2FA", async () => {
    useAuthStore().challengeToken = "reto";
    const wrapper = mount(TwoFactorVerifyView, { global: { plugins: [i18n] } });
    await wrapper.find("input").setValue("123456");
    return { wrapper, submit: () => wrapper.find(".submit-btn").trigger("click") };
  }],
  ["activación 2FA", async () => {
    useAuthStore().challengeToken = "reto";
    const wrapper = mount(TwoFactorSetupView, { global: { plugins: [i18n] } });
    await flushPromises(); // el código QR se pide al abrir la pantalla
    await wrapper.find("input").setValue("123456");
    return { wrapper, submit: () => wrapper.find(".submit-btn").trigger("click") };
  }],
];

describe.each(views)("US39 - Pantalla de %s", (_, render) => {
  async function submitWith(error) {
    // Solo falla el intento: preparar la activación del 2FA responde con normalidad.
    post.mockImplementation((url) => (url === "/auth/2fa/setup"
      ? Promise.resolve({ data: { qrCodeDataUrl: "data:image/png;base64,", secret: "SECRETO" } })
      : Promise.reject(error)));
    const view = await render();
    await view.submit();
    await flushPromises();
    return view.wrapper.find(".error-box").text();
  }

  it("testLimite_MuestraLaEsperaDelApi", async () => {
    await expect(submitWith(tooMany(42))).resolves
      .toBe("Demasiados intentos. Vuelve a intentarlo en 42 segundos.");
  });

  it("testLimite_Singular", async () => {
    await expect(submitWith(tooMany(1))).resolves
      .toBe("Demasiados intentos. Vuelve a intentarlo en 1 segundo.");
  });

  it("testLimite_EnIngles", async () => {
    i18n.global.locale.value = "en";

    await expect(submitWith(tooMany(30))).resolves.toBe("Too many attempts. Try again in 30 seconds.");
  });

  it("testLimite_SinTiempoPideEsperar", async () => {
    await expect(submitWith(failure(429, ""))).resolves
      .toBe("Demasiados intentos. Espera un momento y vuelve a intentarlo.");
  });

  it("testOtrosErrores_SinCambios", async () => {
    await expect(submitWith(failure(400, { error: "Datos no válidos" }))).resolves
      .toBe("Datos no válidos");
  });

  it("testSinRespuesta_ErrorGenerico", async () => {
    await expect(submitWith(new Error("network"))).resolves.toBe(i18n.global.t("common.error"));
    expect(push).not.toHaveBeenCalled();
  });
});
