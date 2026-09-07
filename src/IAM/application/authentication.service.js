/**
 * Authentication application service.
 * Layer: IAM / application
 *
 * Implements the following IAM use cases:
 *   - Log in
 *   - Register customer
 *   - Register employee
 *   - Re-accept terms & conditions
 *   - TOTP 2FA setup / enable / verify
 *   - Log out
 *
 * Encapsulates the API calls and the auth store updates. Every step of the
 * auth flow (login, register, accept-terms) can hand control to the next
 * one instead of a real session — `handleAuthStep` normalizes that into a
 * single shape the views branch on: `{ requiresTermsAcceptance? }`,
 * `{ requires2fa? }`, `{ requires2faSetup? }`, or `{ user }`.
 */
import { AuthApi } from "../infrastructure/auth.api.js";
import { useAuthStore } from "./auth.store.js";

function handleAuthStep(data) {
  const auth = useAuthStore();

  if (data.requiresTermsAcceptance) {
    auth.setChallengeToken(data.challengeToken);
    return { requiresTermsAcceptance: true };
  }
  if (data.requires2fa) {
    auth.setChallengeToken(data.challengeToken);
    return { requires2fa: true };
  }
  if (data.requires2faSetup) {
    auth.setChallengeToken(data.challengeToken);
    return { requires2faSetup: true };
  }

  auth.setAuth(data.user, data.token);
  return { user: data.user };
}

export const AuthenticationService = {
  async login({ email, password }) {
    const data = await AuthApi.login({ email, password });
    return handleAuthStep(data);
  },

  /** Continues the flow started by `login()` after re-accepting the current terms. */
  async acceptTerms(version) {
    const auth = useAuthStore();
    const data = await AuthApi.acceptTerms({ version, challengeToken: auth.challengeToken });
    return handleAuthStep(data);
  },

  async registerClient({ name, email, password, phone, acceptedTermsVersion }) {
    const data = await AuthApi.registerClient({ name, email, password, phone, acceptedTermsVersion });
    return handleAuthStep(data);
  },

  async registerWorker(workerData) {
    const data = await AuthApi.registerWorker(workerData);
    return handleAuthStep(data);
  },

  /** Generates a new TOTP secret + QR code for the account behind the pending challenge token. */
  async setupTwoFactor() {
    const auth = useAuthStore();
    return AuthApi.setup2fa(auth.challengeToken); // { qrCodeDataUrl, secret }
  },

  /** Confirms the first TOTP code, enables 2FA and establishes the session. */
  async enableTwoFactor(code) {
    const auth = useAuthStore();
    const data = await AuthApi.enable2fa({ token: auth.challengeToken, code });
    auth.setAuth(data.user, data.token);
    auth.clearChallengeToken();
    return data.user;
  },

  /** Validates a TOTP code against the challenge token issued at login and establishes the session. */
  async verifyTwoFactor(code) {
    const auth = useAuthStore();
    const data = await AuthApi.verify2fa({ challengeToken: auth.challengeToken, code });
    auth.setAuth(data.user, data.token);
    auth.clearChallengeToken();
    return data.user;
  },

  logout() {
    const auth = useAuthStore();
    auth.clearAuth();
  },
};
