/**
 * Messaging — domain mapping.
 *
 * `raw` in every test is a verbatim copy of what the backend actually serialises
 * (Messaging/Interfaces/REST/Resources/MessagingResources.cs -> MessageResource /
 * ConversationResource, camelCased by the default System.Text.Json options).
 */
import { describe, it, expect } from "vitest";
import { Message } from "../src/Shared/domain/model/message.entity.js";
import { Conversation } from "../src/Shared/domain/model/conversation.entity.js";

/** MessageResource(Id, SenderId, RecipientId, Content, CreatedAt, ReadAt) */
const rawMessage = {
  id: 7,
  senderId: 10,
  recipientId: 20,
  content: "Hola, buenas tardes",
  createdAt: "2026-09-08T15:04:05+00:00",
  readAt: "2026-09-08T15:06:00+00:00",
};

describe("Message.fromApi", () => {
  it("keeps the identity fields the chat needs to pick a side", () => {
    const m = Message.fromApi(rawMessage);
    expect(m.id).toBe(7);
    expect(m.senderId).toBe(10);
    expect(m.content).toBe("Hola, buenas tardes");
    expect(m.createdAt).toBe(rawMessage.createdAt);
  });

  it("maps the recipient of the message", () => {
    const m = Message.fromApi(rawMessage);
    expect(m.receiverId).toBe(20);
  });

  it("maps the read state from readAt", () => {
    expect(Message.fromApi(rawMessage).read).toBe(true);
    expect(Message.fromApi({ ...rawMessage, readAt: null }).read).toBe(false);
  });

  it("isMine() answers from the point of view of each participant", () => {
    const m = Message.fromApi(rawMessage);
    expect(m.isMine(10)).toBe(true);
    expect(m.isMine(20)).toBe(false);
  });

  it("isMine() survives an id that arrives as a string", () => {
    // auth.user is rehydrated from localStorage; a stringified id must not flip the side.
    const m = Message.fromApi(rawMessage);
    expect(m.isMine("10")).toBe(true);
  });
});

describe("Conversation.fromApi", () => {
  it("maps the conversation row", () => {
    const c = Conversation.fromApi({
      userId: 20,
      userName: "Maria",
      lastMessage: "cuando la necesita?",
      lastMessageAt: "2026-09-08T15:06:00+00:00",
      unreadCount: 2,
    });
    expect(c.userId).toBe(20);
    expect(c.userName).toBe("Maria");
    expect(c.hasUnread()).toBe(true);
  });

  it("defaults unreadCount when the backend omits it", () => {
    const c = Conversation.fromApi({ userId: 20, userName: "Maria" });
    expect(c.unreadCount).toBe(0);
    expect(c.hasUnread()).toBe(false);
  });
});
