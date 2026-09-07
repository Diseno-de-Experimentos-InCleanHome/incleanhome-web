/**
 * Cliente API de postulaciones a eventos.
 * Capa: Events / infrastructure
 *
 * Endpoints: POST /events/:id/applications, GET /events/:id/applications,
 * PATCH /events/:eventId/applications/:appId/accept|reject|withdraw
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const EventApplicationApi = {
  async apply(eventId, message) {
    const { data } = await apiClient.post(`/events/${eventId}/applications`, { message });
    return data;
  },
  async listByEvent(eventId) {
    const { data } = await apiClient.get(`/events/${eventId}/applications`);
    return data;
  },
  async accept(eventId, appId) {
    const { data } = await apiClient.patch(`/events/${eventId}/applications/${appId}/accept`);
    return data;
  },
  async reject(eventId, appId) {
    const { data } = await apiClient.patch(`/events/${eventId}/applications/${appId}/reject`);
    return data;
  },
  async withdraw(eventId, appId) {
    const { data } = await apiClient.patch(`/events/${eventId}/applications/${appId}/withdraw`);
    return data;
  },
};
