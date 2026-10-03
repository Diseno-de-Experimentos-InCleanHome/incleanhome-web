/**
 * Entidad Message — mensajería entre cliente y trabajadora.
 * Capa: Shared / domain / model
 *
 * Representa un mensaje individual dentro de una conversación.
 */
export class Message {
  constructor({ id, senderId, receiverId, content, createdAt, readAt = null }) {
    this.id = id;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.content = content;
    this.createdAt = createdAt;
    this.readAt = readAt;
    this.read = readAt != null;
  }

  /**
   * ¿El mensaje lo envió el usuario indicado?
   *
   * La comparación es por texto a propósito: el id del mensaje llega como número desde
   * la API, mientras que el de la sesión sale de localStorage y puede haberse guardado
   * como string. Con `===` toda la conversación caía del lado del interlocutor.
   */
  isMine(currentUserId) {
    if (currentUserId === null || currentUserId === undefined) return false;
    return String(this.senderId) === String(currentUserId);
  }

  static fromApi(raw) {
    return new Message({
      id: raw.id,
      senderId: raw.senderId,
      // El backend serializa MessageResource.RecipientId como `recipientId`.
      receiverId: raw.recipientId,
      content: raw.content,
      createdAt: raw.createdAt,
      readAt: raw.readAt ?? null,
    });
  }
}
