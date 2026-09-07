/**
 * Cliente API de mensajería.
 * Capa: Shared / infrastructure
 *
 * Hace las llamadas HTTP al backend y devuelve la data real.
 * El mapeo a entidades de dominio lo hace la capa de aplicación.
 */
import apiClient from "./http/api.client.js";

export const MessagingApi = {
  /** GET /messages/conversations — lista todas las conversaciones del usuario */
  async listConversations() {
    const { data } = await apiClient.get("/messages/conversations");
    return data;
  },

  /** GET /messages/:userId — historial con un usuario específico */
  async listWithUser(userId) {
    const { data } = await apiClient.get(`/messages/${userId}`);
    return data;
  },

  /** POST /messages/:userId — enviar un mensaje */
  async sendTo(userId, content) {
    const { data } = await apiClient.post(`/messages/${userId}`, { content });
    return data;
  },
};
