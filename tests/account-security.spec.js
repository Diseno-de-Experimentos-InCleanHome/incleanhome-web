/**
 * US40 — actividad de acceso y cambio de contraseña. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, enableAutoUnmount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { params: {}, query: {}, path: "/client/bookings" };
const push = vi.fn();
const replace = vi.fn();
// Las pantallas usan la ruta simulada; las pruebas de rutas, el enrutador real.
vi.mock("vue-router", async (original) => ({
  ...(await original()), useRoute: () => route, useRouter: () => ({ push, replace }),
}));

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), put: (...a) => put(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { AuthenticationService } from "../src/IAM/application/authentication.service.js";
import { passwordProblems } from "../src/IAM/domain/services/password-policy.js";
import { roleAccountPath } from "../src/Shared/domain/constants/roles.js";
import AccountActivityView from "../src/IAM/presentation/views/AccountActivityView.vue";
import ChangePasswordView from "../src/IAM/presentation/views/ChangePasswordView.vue";
import PasswordChangeBanner from "../src/IAM/presentation/components/PasswordChangeBanner.vue";
import LoginView from "../src/IAM/presentation/views/LoginView.vue";
import TwoFactorVerifyView from "../src/IAM/presentation/views/TwoFactorVerifyView.vue";

const failure = (status, data = {}) => Promise.reject({ response: { status, data, headers: {} } });
const user = { id: 1, role: "client", email: "persona@ejemplo.test" };
const STRONG = "Clave#Nueva-2026";

const accesses = [
  { id: 69, occurredAt: "2026-11-28T01:32:30.43+00:00", platform: "mobile", twoFactorVerified: true, result: "success" },
  { id: 68, occurredAt: "2026-11-27T20:31:02+00:00", platform: "web", twoFactorVerified: false, result: "failed" },
  { id: 12, occurredAt: "2026-11-20T10:00:00+00:00", platform: "unknown", twoFactorVerified: false, result: "failed" },
];
let activity;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  i18n.global.locale.value = "es";
  route.path = "/client/bookings";
  activity = { twoFactorEnabled: true, accesses, passwordChangeRequired: false };
  get.mockImplementation(async () => ({ data: activity }));
  post.mockResolvedValue({});
  put.mockResolvedValue({});
});
enableAutoUnmount(afterEach);

async function mountView(component) {
  const wrapper = mount(component, { global: { plugins: [i18n], stubs: { RouterLink: true } } });
  await flushPromises();
  return wrapper;
}

const rows = (wrapper) => wrapper.findAll('[data-test="access"]');
const signIn = (extra) => useAuthStore().setAuth(user, "sesion", extra);

describe("US40 - Política de contraseñas", () => {
  it.each([
    [STRONG, []],
    ["Corta#1a", ["minLength"]],
    [`Aa1#${"xy".repeat(35)}`, ["maxLength"]],
    ["Clave Nueva#2026", ["spaces"]],
    ["CLAVE#NUEVA-2026", ["lowercase"]],
    ["clave#nueva-2026", ["uppercase"]],
    ["Clave#Nueva-Sol", ["digit"]],
    ["ClaveNueva202613", ["symbol"]],
    ["Claveee#Nueva-26", ["repeated"]],
    ["Password#Nueva-26", ["common"]],
    ["Persona#Nueva-26", ["email"]],
  ])("testRegla '%s'", (password, problems) => {
    expect(passwordProblems(password, user.email)).toEqual(problems);
  });

  it("testRutaDeCadaRol", () => {
    expect(["client", "worker", "admin"].map(roleAccountPath))
      .toEqual(["/client/account", "/worker/account", "/admin/account"]);
  });
});

describe("US40 - Actividad de la cuenta", () => {
  beforeEach(() => signIn());

  // Escenario 1
  it("testConsulta_FechaPlataformaResultadoYSegundoFactor", async () => {
    const wrapper = await mountView(AccountActivityView);

    expect(get).toHaveBeenCalledWith("/auth/access-activity");
    expect(wrapper.find('[data-test="two-factor"]').text()).toContain("Activada");
    const [mobile, web, unknown] = rows(wrapper).map((row) => row.text());
    expect(mobile).toContain("Móvil");
    expect(mobile).toContain("Correcto");
    expect(mobile).toContain("Con segundo factor");
    expect(mobile).toMatch(/2026/);
    expect(mobile).toMatch(/\d{1,2}:\d{2}/);
    expect(web).toContain("Web");
    expect(web).toContain("Fallido");
    expect(web).toContain("Sin segundo factor");
    expect(unknown).toContain("Plataforma desconocida");
  });

  // Escenario 3
  it("testSinActividadPrevia_SoloElAccesoVigente", async () => {
    activity = { twoFactorEnabled: false, accesses: [accesses[0]], passwordChangeRequired: false };

    const wrapper = await mountView(AccountActivityView);

    expect(rows(wrapper)).toHaveLength(1);
    expect(wrapper.find('[data-test="two-factor"]').text()).toContain("Desactivada");
  });

  it("testListaVacia_LoDice", async () => {
    activity = { twoFactorEnabled: true, accesses: [], passwordChangeRequired: false };

    const wrapper = await mountView(AccountActivityView);

    expect(wrapper.find('[data-test="activity-empty"]').exists()).toBe(true);
  });

  it("testError_ConReintento", async () => {
    get.mockImplementationOnce(() => failure(500));
    const wrapper = await mountView(AccountActivityView);
    expect(wrapper.text()).toContain("No pudimos cargar la actividad de tu cuenta.");

    await wrapper.find('[data-test="activity-retry"]').trigger("click");
    await flushPromises();

    expect(rows(wrapper)).toHaveLength(3);
  });

  // Escenario 2
  it("testReporte_PideConfirmacionCierraSesionesYPideCambio", async () => {
    const wrapper = await mountView(AccountActivityView);
    await rows(wrapper)[1].find('[data-test="report"]').trigger("click");
    expect(post).not.toHaveBeenCalled();
    expect(wrapper.find('[role="dialog"]').text()).toContain("Esta sesión seguirá abierta");
    activity = { ...activity, passwordChangeRequired: true };

    await wrapper.find('[data-test="confirm-report"]').trigger("click");
    await flushPromises();

    expect(post).toHaveBeenCalledWith("/auth/access-activity/68/report");
    expect(wrapper.find('[data-test="report-done"]').text()).toContain("cambia tu contraseña");
    expect(rows(wrapper)[1].text()).toContain("Reportado");
    expect(rows(wrapper)[1].find('[data-test="report"]').exists()).toBe(false);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(useAuthStore().passwordChangeRequired).toBe(true);
    expect(useAuthStore().isLoggedIn).toBe(true);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("testReporte_CancelarNoEnviaNada", async () => {
    const wrapper = await mountView(AccountActivityView);
    await rows(wrapper)[0].find('[data-test="report"]').trigger("click");

    await wrapper.find('[role="dialog"] .btn-secondary').trigger("click");

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it.each([[404, "No encontramos ese acceso en tu cuenta."], [500, "Ocurrió un error"]])(
    "testReporte_Error %i", async (status, message) => {
      post.mockImplementation(() => failure(status));
      const wrapper = await mountView(AccountActivityView);
      await rows(wrapper)[0].find('[data-test="report"]').trigger("click");

      await wrapper.find('[data-test="confirm-report"]').trigger("click");
      await flushPromises();

      expect(wrapper.find(".error-box").text()).toBe(message);
      expect(useAuthStore().passwordChangeRequired).toBe(false);
    });

  it("testAvisoPendiente_SeSincronizaConElApi", async () => {
    signIn({ passwordChangeRequired: true });

    await mountView(AccountActivityView);

    expect(useAuthStore().passwordChangeRequired).toBe(false);
  });

  it("testTextosEnIngles", async () => {
    i18n.global.locale.value = "en";

    const wrapper = await mountView(AccountActivityView);

    expect(wrapper.text()).toContain("Account activity");
    expect(rows(wrapper)[0].text()).toContain("Mobile");
    expect(rows(wrapper)[0].text()).toContain("I don't recognize this");
  });
});

async function fill(wrapper, { current = "Clave#Actual-2025", next = STRONG, confirmation = next } = {}) {
  await wrapper.find("#password-currentPassword").setValue(current);
  await wrapper.find("#password-newPassword").setValue(next);
  await wrapper.find("#password-confirmation").setValue(confirmation);
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("US40 - Cambio de contraseña con sesión", () => {
  beforeEach(() => signIn({ passwordChangeRequired: true }));

  it("testCambio_EnviaLasContrasenasYQuitaElAviso", async () => {
    const wrapper = await mountView(ChangePasswordView);
    expect(wrapper.find('[data-test="password-required"]').exists()).toBe(true);

    await fill(wrapper);

    expect(put).toHaveBeenCalledWith("/auth/password",
      { currentPassword: "Clave#Actual-2025", newPassword: STRONG }, undefined);
    expect(wrapper.find('[data-test="password-done"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="password-required"]').exists()).toBe(false);
    expect(wrapper.find("#password-newPassword").element.value).toBe("");
    expect(useAuthStore().passwordChangeRequired).toBe(false);
    expect(useAuthStore().isLoggedIn).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([
    [{ current: "" }, "Este campo es obligatorio"],
    [{ next: "corta" }, "Debe tener al menos 12 caracteres."],
    [{ current: STRONG }, "La nueva contraseña debe ser distinta de la actual."],
    [{ confirmation: "Otra#Clave-2026" }, "Las contraseñas no coinciden."],
  ])("testValidacion %j", async (values, message) => {
    const wrapper = await mountView(ChangePasswordView);

    await fill(wrapper, values);

    expect(wrapper.text()).toContain(message);
    expect(put).not.toHaveBeenCalled();
  });

  it("testContrasenaActualIncorrecta_MuestraElMotivo", async () => {
    put.mockImplementation(() => failure(400, { error: "La contraseña actual no es correcta" }));
    const wrapper = await mountView(ChangePasswordView);

    await fill(wrapper);

    expect(wrapper.find(".error-box").text()).toBe("La contraseña actual no es correcta");
    expect(useAuthStore().passwordChangeRequired).toBe(true);
  });

  it("testLimiteDeIntentos_MuestraLaEspera", async () => {
    put.mockImplementation(() => failure(429, { retryAfterSeconds: 30 }));
    const wrapper = await mountView(ChangePasswordView);

    await fill(wrapper);

    expect(wrapper.find(".error-box").text()).toContain("30 segundos");
  });
});

describe("US40 - Cambio obligatorio antes de abrir sesión", () => {
  beforeEach(() => useAuthStore().setChallengeToken("reto-cambio"));

  it("testCambio_UsaElTokenDeCambioYVuelveAlInicioDeSesion", async () => {
    const wrapper = await mountView(ChangePasswordView);

    await fill(wrapper);

    expect(put.mock.calls[0][2]).toEqual({ headers: { Authorization: "Bearer reto-cambio" } });
    expect(replace).toHaveBeenCalledWith("/login");
    expect(useAuthStore().challengeToken).toBeNull();
    expect(useAuthStore().notice).toBe("password_changed");
    expect(useAuthStore().isLoggedIn).toBe(false);
  });

  it("testTokenVencido_VuelveAlInicioDeSesionConElMotivo", async () => {
    put.mockImplementation(() => failure(401));
    const wrapper = await mountView(ChangePasswordView);

    await fill(wrapper);

    expect(replace).toHaveBeenCalledWith("/login");
    expect(useAuthStore().notice).toBe("password_expired");
  });

  it("testSinToken_VuelveAlInicioDeSesion", async () => {
    useAuthStore().clearChallengeToken();

    await mountView(ChangePasswordView);

    expect(replace).toHaveBeenCalledWith("/login");
  });
});

describe("US40 - Rutas", () => {
  async function visit(path) {
    const { default: appRouter } = await import("../src/router.js");
    await appRouter.push(path);
    return appRouter.currentRoute.value.path;
  }

  it.each(["client", "worker", "admin"])("testRutasDeLaCuenta de %s", async (role) => {
    useAuthStore().setAuth({ ...user, role }, "sesion");

    expect(await visit(`/${role}/account`)).toBe(`/${role}/account`);
    expect(await visit(`/${role}/account/password`)).toBe(`/${role}/account/password`);
    expect(await visit("/change-password")).toBe(`/${role}/account/password`);
  });

  it("testSinSesion_LaCuentaPideIniciarSesionYElCambioObligatorioEsPublico", async () => {
    expect(await visit("/client/account")).toBe("/login");
    expect(await visit("/change-password")).toBe("/change-password");
  });
});

describe("US40 - Avisos y acceso", () => {
  it("testAviso_SoloConCambioPendiente", async () => {
    signIn();
    const wrapper = await mountView(PasswordChangeBanner);
    expect(wrapper.find('[data-test="password-banner"]').exists()).toBe(false);

    useAuthStore().setPasswordChangeRequired(true);
    await flushPromises();

    expect(wrapper.find('[data-test="password-banner"]').text()).toContain("cambia tu contraseña");
    expect(wrapper.find("router-link-stub").attributes("to")).toBe("/client/account/password");
  });

  it("testAviso_NoSeRepiteEnLaPantallaDelCambio", async () => {
    signIn({ passwordChangeRequired: true });
    route.path = "/client/account/password";

    const wrapper = await mountView(PasswordChangeBanner);

    expect(wrapper.find('[data-test="password-banner"]').exists()).toBe(false);
  });

  it("testAviso_SobreviveAUnaRecarga", () => {
    signIn({ passwordChangeRequired: true });

    setActivePinia(createPinia());

    expect(useAuthStore().passwordChangeRequired).toBe(true);
  });

  it.each([
    ["session_closed", "Tu sesión se cerró."],
    ["password_changed", "Inicia sesión con la nueva."],
  ])("testInicioDeSesion_MuestraElAviso %s", async (notice, text) => {
    useAuthStore().setNotice(notice);

    const wrapper = await mountView(LoginView);

    expect(wrapper.find(".notice-box").text()).toContain(text);
  });

  async function verify(response) {
    post.mockResolvedValue({ data: response });
    useAuthStore().setChallengeToken("reto-2fa");
    const wrapper = await mountView(TwoFactorVerifyView);
    await wrapper.find("input").setValue("123456");
    await wrapper.find(".submit-btn").trigger("click");
    await flushPromises();
  }

  it.each([
    ["sin cambio pendiente", { user, token: "t", passwordChangeRequired: false }, "/client/search"],
    ["con cambio solicitado", { user, token: "t", passwordChangeRequired: true }, "/client/account/password"],
    ["con cambio obligatorio", { requiresPasswordChange: true, challengeToken: "reto-cambio" }, "/change-password"],
  ])("testInicioDeSesion %s", async (_, response, path) => {
    await verify(response);

    expect(push).toHaveBeenCalledWith(path);
    const auth = useAuthStore();
    expect(auth.isLoggedIn).toBe(Boolean(response.token));
    expect(auth.challengeToken).toBe(response.challengeToken ?? null);
  });

  it("testActivacion2FA_TambienAtiendeElCambioObligatorio", async () => {
    useAuthStore().setChallengeToken("reto-alta");
    post.mockResolvedValue({ data: { requiresPasswordChange: true, challengeToken: "reto-cambio" } });

    const result = await AuthenticationService.enableTwoFactor("123456");

    expect(result).toEqual({ requiresPasswordChange: true });
    expect(useAuthStore().isLoggedIn).toBe(false);
  });
});
