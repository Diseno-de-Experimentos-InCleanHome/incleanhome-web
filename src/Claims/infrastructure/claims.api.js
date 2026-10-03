/**
 * Cliente API del libro de reclamaciones.
 * Capa: Claims / infrastructure
 *
 * Endpoints:
 *   POST /claims             — público, registra un reclamo/queja
 *   GET  /claims/track/:code — público, consulta de estado por código
 *   GET  /claims             — admin, lista (filtro por estado)
 *   PATCH /claims/:id/review — admin, cambia estado + nota
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const ClaimsApi = {
  async create(payload) {
    const { data } = await apiClient.post("/claims", payload);
    return data; // { code, status }
  },
  async track(code) {
    const { data } = await apiClient.get(`/claims/track/${encodeURIComponent(code)}`);
    return data;
  },
  async list(status) {
    const { data } = await apiClient.get("/claims", { params: status ? { status } : {} });
    return data;
  },
  async review(id, { status, note }) {
    const { data } = await apiClient.patch(`/claims/${id}/review`, { status, note });
    return data;
  },
};
