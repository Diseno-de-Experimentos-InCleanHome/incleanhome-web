/**
 * Entidad Conversation — agrupa mensajes con otro usuario.
 * Capa: Shared / domain / model
 */
export class Conversation {
  constructor({ userId, userName, lastMessage, lastMessageAt, unreadCount = 0 }) {
    this.userId = userId;
    this.userName = userName;
    this.lastMessage = lastMessage;
    this.lastMessageAt = lastMessageAt;
    this.unreadCount = unreadCount;
  }

  hasUnread() {
    return this.unreadCount > 0;
  }

  static fromApi(raw) {
    return new Conversation({
      userId: raw.userId,
      userName: raw.userName,
      lastMessage: raw.lastMessage,
      lastMessageAt: raw.lastMessageAt,
      unreadCount: raw.unreadCount ?? 0,
    });
  }
}
