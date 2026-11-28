/**
 * US40 — sesiones cerradas. Usa el cliente HTTP real con un transporte simulado.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import apiClient from "../src/Shared/infrastructure/http/api.client.js";
import { installSessionGuard } from "../src/IAM/application/session-guard.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";

const originalAdapter = apiClient.defaults.adapter;
const onClosed = vi.fn(() => useAuthStore().closeSession());
installSessionGuard({ client: apiClient, onClosed });

/** El API responde siempre con ese estado. */
function answers(status) {
  apiClient.defaults.adapter = async (config) => {
    const response = { status, data: { error: "Tu sesión se cerró. Inicia sesión nuevamente" }, headers: {}, config };
    if (status < 300) return response;
    throw Object.assign(new Error("http"), { config, response });
  };
}

const signIn = (token = "sesion-vigente") => useAuthStore().setAuth({ id: 1, role: "client" }, token);

describe("US40 - Sesión cerrada", () => {
  beforeEach(() => {
    localStorage.clear();
    onClosed.mockClear();
    setActivePinia(createPinia());
  });
  afterAll(() => { apiClient.defaults.adapter = originalAdapter; });

  it("testSesionCerrada_SeCierraUnaSolaVezAunqueFallenVariasPeticiones", async () => {
    signIn();
    answers(401);

    const results = await Promise.allSettled([apiClient.get("/bookings"), apiClient.get("/messages")]);

    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected"]);
    expect(onClosed).toHaveBeenCalledTimes(1);
    const auth = useAuthStore();
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.notice).toBe("session_closed");
    expect(localStorage.getItem("inclean_token")).toBeNull();
  });

  it("testCambioDeContrasena_ConLaSesionCerradaTambienSale", async () => {
    signIn();
    answers(401);

    await expect(apiClient.put("/auth/password", {})).rejects.toThrow();

    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it.each(["/auth/login", "/auth/accept-terms", "/auth/2fa/verify", "/auth/register/client"])(
    "testPasoDelAcceso %s: un 401 no cierra la sesión", async (url) => {
      signIn();
      answers(401);

      await expect(apiClient.post(url, {})).rejects.toThrow();

      expect(onClosed).not.toHaveBeenCalled();
    });

  it.each([403, 404, 500])("testOtroEstado %i no cierra la sesión", async (status) => {
    signIn();
    answers(status);

    await expect(apiClient.get("/bookings")).rejects.toThrow();

    expect(onClosed).not.toHaveBeenCalled();
  });

  it("testSinSesion_NoHaceNada", async () => {
    answers(401);

    await expect(apiClient.put("/auth/password", {}, { headers: { Authorization: "Bearer reto" } }))
      .rejects.toThrow();

    expect(onClosed).not.toHaveBeenCalled();
  });

  it("testRespuestaDeUnaSesionAnterior_NoCierraLaActual", async () => {
    signIn("sesion-anterior");
    let release;
    apiClient.defaults.adapter = (config) => new Promise((_, reject) => {
      release = () => reject(Object.assign(new Error("http"), { config, response: { status: 401 } }));
    });
    const late = apiClient.get("/bookings");
    await vi.waitFor(() => expect(release).toBeDefined());
    signIn("sesion-nueva");

    release();
    await expect(late).rejects.toThrow();

    expect(onClosed).not.toHaveBeenCalled();
    expect(useAuthStore().isLoggedIn).toBe(true);
  });
});
