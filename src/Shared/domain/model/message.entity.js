/**
 * Entidad Message — mensajería entre cliente y trabajador.
 * Capa: Shared / domain / model
 *
 * Representa un mensaje individual dentro de una conversación.
 */
export class Message {
  constructor({ id, senderId, receiverId, content, createdAt, read = false }) {
    this.id = id;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.content = content;
    this.createdAt = createdAt;
    this.read = read;
  }

  /** ¿El mensaje lo envió el usuario indicado? */
  isMine(currentUserId) {
    return this.senderId === currentUserId;
  }

  static fromApi(raw) {
    return new Message({
      id: raw.id,
      senderId: raw.senderId,
      receiverId: raw.receiverId,
      content: raw.content,
      createdAt: raw.createdAt,
      read: raw.read,
    });
  }
}
