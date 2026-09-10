/**
 * ChatView — which side of the thread each bubble lands on.
 *
 * Reproduces the reported symptom: "los mensajes solo aparecen de un lado de la conversacion".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { params: { userId: "20" } };

vi.mock("vue-router", () => ({ useRoute: () => route }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (k) => k }) }));

const getMessagesWith = vi.fn();
const getConversations = vi.fn();
const sendMessage = vi.fn();

vi.mock("../src/Shared/application/messaging.service.js", () => ({
  MessagingService: {
    getMessagesWith: (...a) => getMessagesWith(...a),
    getConversations: (...a) => getConversations(...a),
    sendMessage: (...a) => sendMessage(...a),
  },
}));

import ChatView from "../src/Shared/presentation/views/ChatView.vue";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { Message } from "../src/Shared/domain/model/message.entity.js";

const CURRENT_USER = 10;
const PEER = 20;

/** Exactly what GET /api/messages/20 returns for a two-way thread. */
const thread = [
  { id: 1, senderId: CURRENT_USER, recipientId: PEER, content: "Hola, buenas tardes", createdAt: "2026-09-08T15:00:00+00:00", readAt: null },
  { id: 2, senderId: PEER, recipientId: CURRENT_USER, content: "Hola, en que puedo ayudarla", createdAt: "2026-09-08T15:01:00+00:00", readAt: null },
  { id: 3, senderId: CURRENT_USER, recipientId: PEER, content: "Necesito limpieza el sabado", createdAt: "2026-09-08T15:02:00+00:00", readAt: null },
];

async function mountChat(sessionUser) {
  setActivePinia(createPinia());
  const auth = useAuthStore();
  auth.user = sessionUser;

  getConversations.mockResolvedValue([{ userId: PEER, userName: "Maria" }]);
  getMessagesWith.mockResolvedValue(thread.map(Message.fromApi));

  const wrapper = mount(ChatView, { global: { stubs: { AppIcon: true } } });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  vi.clearAllMocks();
  route.params.userId = String(PEER);
});

describe("ChatView", () => {
  it("renders every message of the thread", async () => {
    const w = await mountChat({ id: CURRENT_USER, role: "client" });
    expect(w.findAll(".msg-bubble")).toHaveLength(3);
  });

  it("splits the thread into both sides when the session id is a number", async () => {
    const w = await mountChat({ id: CURRENT_USER, role: "client" });
    expect(w.findAll(".bubble-mine")).toHaveLength(2);
    expect(w.findAll(".bubble-theirs")).toHaveLength(1);
  });

  it("still splits the thread when the session id was rehydrated as a string", async () => {
    // localStorage / older sessions can hand back "10" instead of 10.
    const w = await mountChat({ id: String(CURRENT_USER), role: "client" });
    expect(w.findAll(".bubble-mine")).toHaveLength(2);
    expect(w.findAll(".bubble-theirs")).toHaveLength(1);
  });

  it("shows the peer name in the header", async () => {
    const w = await mountChat({ id: CURRENT_USER, role: "client" });
    expect(w.find(".chat-title").text()).toBe("Maria");
  });

  it("sends to the peer id from the route and reloads the thread", async () => {
    const w = await mountChat({ id: CURRENT_USER, role: "client" });
    sendMessage.mockResolvedValue({});

    await w.find("input.chat-input-field").setValue("  a las 9  ");
    await w.find("input.chat-input-field").trigger("keyup.enter");
    await flushPromises();

    expect(sendMessage).toHaveBeenCalledWith(String(PEER), "  a las 9  ");
    expect(getMessagesWith).toHaveBeenCalledTimes(2);
  });

  it("keeps the draft and reports the failure when the send is rejected", async () => {
    // sendMessage() clears the input before awaiting and has no try/catch, so a rejected
    // send loses what the user typed and surfaces nothing but an unhandled rejection.
    const unhandled = [];
    const onUnhandled = (e) => { unhandled.push(e); e.preventDefault?.(); };
    process.on("unhandledRejection", onUnhandled);

    const w = await mountChat({ id: CURRENT_USER, role: "client" });
    sendMessage.mockRejectedValue({ response: { data: { error: "Message content cannot be empty." } } });

    const input = w.find("input.chat-input-field");
    await input.setValue("hola");
    await input.trigger("keyup.enter");
    await flushPromises();

    process.off("unhandledRejection", onUnhandled);

    expect(w.findAll(".msg-bubble")).toHaveLength(3);
    expect(input.element.value).toBe("hola");
  });
});
