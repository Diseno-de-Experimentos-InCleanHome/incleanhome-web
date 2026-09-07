/**
 * Servicio de aplicación de mensajería.
 * Capa: Shared
 *
 * Orquesta la API y mapea las respuestas a entidades de dominio.
 * Las vistas dependen de este servicio, NO del cliente HTTP.
 */
import { MessagingApi } from "../infrastructure/messaging.api.js";
import { Conversation } from "../domain/model/conversation.entity.js";
import { Message } from "../domain/model/message.entity.js";

export const MessagingService = {
  /** Lista las conversaciones del usuario actual. */
  async getConversations() {
    const raw = await MessagingApi.listConversations();
    return raw.map(Conversation.fromApi);
  },

  /** Obtiene el historial de mensajes con un usuario. */
  async getMessagesWith(userId) {
    const raw = await MessagingApi.listWithUser(userId);
    return raw.map(Message.fromApi);
  },

  /** Envía un mensaje a un usuario. */
  async sendMessage(userId, content) {
    if (!content || !content.trim()) {
      throw new Error("El mensaje no puede estar vacío");
    }
    return MessagingApi.sendTo(userId, content.trim());
  },
};
