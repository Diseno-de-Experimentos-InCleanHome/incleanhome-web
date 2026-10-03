/**
 * Cliente API de membresías de trabajadores.
 * Capa: Memberships / infrastructure
 *
 * Endpoints: GET /memberships, PATCH /memberships/:workerId/review
 * Uso exclusivo del panel admin — el trabajador nunca llama a estos endpoints,
 * ya que no recibe un token de sesión hasta que su membresía es aprobada.
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const MembershipApi = {
  async list(status) {
    const { data } = await apiClient.get("/memberships", { params: status ? { status } : {} });
    return data;
  },
  async review(workerId, { status, note }) {
    const { data } = await apiClient.patch(`/memberships/${workerId}/review`, { status, note });
    return data;
  },
};
