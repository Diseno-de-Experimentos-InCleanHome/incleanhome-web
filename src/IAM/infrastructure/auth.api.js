/**
 * Authentication API client.
 * Layer: IAM / infrastructure
 *
 * Endpoints:
 *   POST /auth/login
 *   POST /auth/register/client
 *   POST /auth/register/worker
 *   POST /auth/accept-terms
 *   POST /auth/2fa/setup
 *   POST /auth/2fa/enable
 *   POST /auth/2fa/verify
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const AuthApi = {
  async login({ email, password }) {
    const { data } = await apiClient.post("/auth/login", { email, password });
    return data; // { requiresTermsAcceptance | requires2fa | requires2faSetup, challengeToken } | { user, token }
  },

  async registerClient(payload) {
    const { data } = await apiClient.post("/auth/register/client", payload);
    return data; // { requires2faSetup: true, challengeToken }
  },

  async registerWorker(payload) {
    const { data } = await apiClient.post("/auth/register/worker", payload);
    return data; // { requires2faSetup: true, challengeToken }
  },

  /** Re-accepts the current terms using the challenge token issued at login. */
  async acceptTerms({ version, challengeToken }) {
    const { data } = await apiClient.post(
      "/auth/accept-terms",
      { version },
      { headers: { Authorization: `Bearer ${challengeToken}` } }
    );
    return data; // { requires2fa | requires2faSetup, challengeToken } | { user, token }
  },

  /** Generates a new TOTP secret + QR code for the account behind the given token. */
  async setup2fa(token) {
    const { data } = await apiClient.post(
      "/auth/2fa/setup",
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data; // { qrCodeDataUrl, secret }
  },

  /** Confirms the first TOTP code and enables 2FA for the account. */
  async enable2fa({ token, code }) {
    const { data } = await apiClient.post(
      "/auth/2fa/enable",
      { code },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data; // { user, token }
  },

  /** Validates a TOTP code against the challenge token issued at login. */
  async verify2fa({ challengeToken, code }) {
    const { data } = await apiClient.post("/auth/2fa/verify", { challengeToken, code });
    return data; // { user, token }
  },
};
