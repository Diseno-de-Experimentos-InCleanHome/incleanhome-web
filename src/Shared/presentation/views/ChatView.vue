<template>
  <div class="chat-container">
    <!-- Header -->
    <div class="chat-header mb-4">
      <button @click="$router.back()" class="btn btn-secondary btn-sm">←</button>
      <div class="conv-avatar" :style="{ background: getColor(Number(route.params.userId)) }">
        <span class="conv-initial">{{ otherName[0] || '?' }}</span>
      </div>
      <span class="chat-title">{{ otherName }}</span>
    </div>

    <!-- Messages -->
    <div ref="msgContainer" class="messages-list">
      <div v-if="loading" class="loader-wrapper py-8"><div class="spinner"></div></div>
      <div v-else-if="!messages.length" class="empty-text py-8">Sé el primero en escribir</div>
      <div v-for="msg in messages" :key="msg.id"
        :class="['msg-wrap', msg.senderId === auth.user?.id ? 'msg-mine' : 'msg-theirs']">
        <div :class="['msg-bubble', msg.senderId === auth.user?.id ? 'bubble-mine' : 'bubble-theirs']">
          {{ msg.content }}
        </div>
        <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
      </div>
    </div>

    <!-- Input -->
    <div class="chat-input mt-3 pt-3">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        class="input-field chat-input-field"
        :placeholder="t('messages.typeMessage')" />
      <button @click="sendMessage" class="btn btn-primary" :disabled="!newMessage.trim()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { MessagingService } from "../../application/messaging.service.js";

const { t } = useI18n();
const route = useRoute();
const auth = useAuthStore();
const messages = ref([]);
const loading = ref(true);
const newMessage = ref("");
const msgContainer = ref(null);
const otherName = ref("...");

const colors = ["#009960","#1A2E4A","#00B272","#00B272","#f59e0b","#ef4444"];
function getColor(id) { return colors[id % colors.length]; }
function formatTime(d) { if (!d) return ""; return new Date(d).toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"}); }

async function sendMessage() {
  if (!newMessage.value.trim()) return;
  const content = newMessage.value;
  newMessage.value = "";
  await MessagingService.sendMessage(route.params.userId, content);
  await load();
}

async function scrollBottom() {
  await nextTick();
  if (msgContainer.value) msgContainer.value.scrollTop = msgContainer.value.scrollHeight;
}

async function load() {
  const msgs = await MessagingService.getMessagesWith(route.params.userId);
  messages.value = msgs;
  await scrollBottom();
}

onMounted(async () => {
  try {
    const convos = await MessagingService.getConversations();
    const conv = convos.find(c => String(c.userId) === String(route.params.userId));
    if (conv) otherName.value = conv.userName;
  } catch {}
  try { await load(); } catch {} finally { loading.value = false; }
});
</script>

<style scoped>
.chat-container { 
  display: flex; 
  flex-direction: column; 
  height: calc(100vh - 220px);
  min-height: 400px;
  max-width: 800px; 
  margin: 0 auto; 
}

.chat-header { display: flex; align-items: center; gap: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }

.conv-avatar { width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.conv-initial { color:white; font-weight:700; }
.chat-title { font-weight:700; font-size:1.0625rem; color:#1A2E4A; }

.messages-list { 
  flex: 1; 
  overflow-y: auto; 
  display: flex; 
  flex-direction: column; 
  gap: 0.75rem; 
  padding-right: 0.5rem; 
  padding-bottom: 0.5rem; 
}
.loader-wrapper { display: flex; justify-content: center; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.empty-text { color:#7A8FA6; font-size:0.875rem; text-align: center; }

.msg-wrap { display:flex;flex-direction:column;max-width:70%; }
.msg-mine { align-self:flex-end;align-items:flex-end; }
.msg-theirs { align-self:flex-start;align-items:flex-start; }

.msg-bubble { padding:0.625rem 0.875rem;border-radius:1rem;font-size:0.9375rem;line-height:1.4;word-break:break-word; }
.bubble-mine { background:#009960;color:white;border-bottom-right-radius:4px; }
.bubble-theirs { background:white;color:#1A2E4A;border:1px solid #c5e8d8;border-bottom-left-radius:4px; }
.msg-time { font-size:0.6875rem;color:#7A8FA6;margin-top:2px; }

.chat-input { 
  display: flex; 
  align-items: center; 
  gap: 0.75rem; 
  border-top:1px solid #c5e8d8; 
}
.mt-3 { margin-top: 0.75rem; }
.pt-3 { padding-top: 0.75rem; }
.chat-input-field { flex: 1; }

.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:28px; height:28px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
