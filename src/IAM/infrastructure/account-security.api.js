/**
 * Cliente API de la seguridad de la cuenta (US40).
 * Capa: IAM / infrastructure
 *
 * Endpoints:
 *   GET  /auth/access-activity
 *   POST /auth/access-activity/:id/report
 *   PUT  /auth/password
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const AccountSecurityApi = {
  async getAccessActivity() {
    const { data } = await apiClient.get("/auth/access-activity");
    return data; // { twoFactorEnabled, accesses, passwordChangeRequired }
  },

  async reportAccess(id) {
    await apiClient.post(`/auth/access-activity/${id}/report`);
  },

  /** Sin sesión se envía el token de cambio de contraseña que entregó el inicio de sesión. */
  async changePassword({ currentPassword, newPassword }, challengeToken) {
    const options = challengeToken
      ? { headers: { Authorization: `Bearer ${challengeToken}` } }
      : undefined;
    await apiClient.put("/auth/password", { currentPassword, newPassword }, options);
  },
};
