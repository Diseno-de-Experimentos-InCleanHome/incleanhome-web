/**
 * Cliente API de reservas.
 * Capa: Booking / infrastructure
 *
 * Endpoints: GET /bookings, POST /bookings, PATCH /bookings/:id/status
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const BookingApi = {
  async list()           { const { data } = await apiClient.get("/bookings"); return data; },
  async create(payload)  { const { data } = await apiClient.post("/bookings", payload); return data; },
  async updateStatus(id, status) {
    const { data } = await apiClient.patch(`/bookings/${id}/status`, { status });
    return data;
  },
};
