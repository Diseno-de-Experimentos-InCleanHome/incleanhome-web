/**
 * Cliente API de eventos.
 * Capa: Events / infrastructure
 *
 * Endpoints: POST /events, GET /events, GET /events/mine, GET /events/:id,
 * PATCH /events/:id/cancel, PATCH /events/:id/complete
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const EventApi = {
  async create(payload) {
    const { data } = await apiClient.post("/events", payload);
    return data;
  },
  async searchOpen(params = {}) {
    const { data } = await apiClient.get("/events", { params });
    return data;
  },
  /** Client: their own events. Worker: their own applications (resolved by role on the backend). */
  async listMine() {
    const { data } = await apiClient.get("/events/mine");
    return data;
  },
  async getById(id) {
    const { data } = await apiClient.get(`/events/${id}`);
    return data;
  },
  async cancel(id) {
    const { data } = await apiClient.patch(`/events/${id}/cancel`);
    return data;
  },
  async complete(id) {
    const { data } = await apiClient.patch(`/events/${id}/complete`);
    return data;
  },
};
