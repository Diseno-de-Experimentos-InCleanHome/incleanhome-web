/**
 * Cliente API del catálogo de trabajadoras.
 * Capa: SearchAndCatalog / infrastructure
 *
 * Endpoints: GET /workers, GET /workers/:id, GET /workers/:id/availability
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const CatalogApi = {
  async search(params = {}) {
    const { data } = await apiClient.get("/workers", { params });
    return data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/workers/${id}`);
    return data;
  },
  async getAvailability(workerId) {
    const { data } = await apiClient.get(`/workers/${workerId}/availability`);
    return data;
  },
};
