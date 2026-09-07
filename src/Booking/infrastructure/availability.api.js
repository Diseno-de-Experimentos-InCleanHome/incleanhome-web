/**
 * Cliente API de disponibilidad.
 * Capa: Booking / infrastructure
 *
 * Endpoints: GET /workers/:id/availability, PUT /workers/:id/availability
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const AvailabilityApi = {
  async get(workerId) {
    const { data } = await apiClient.get(`/workers/${workerId}/availability`);
    return data;
  },
  async save(workerId, slots) {
    const { data } = await apiClient.put(`/workers/${workerId}/availability`, { slots });
    return data;
  },
};
