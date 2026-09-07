<template>
  <div class="view-container max-w-4xl">
    <h1 class="page-title mb-6">{{ t('messages.title') }}</h1>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <div v-else-if="!conversations.length" class="card empty-state">
      <AppIcon name="chat" :size="44" class="empty-icon" />
      <p class="empty-text">{{ t('messages.noConversations') }}</p>
      <p class="empty-subtext">{{ t('messages.startConversation') }}</p>
    </div>

    <div v-else class="conv-list">
      <router-link
        v-for="c in conversations" :key="c.userId"
        :to="`${baseRoute}/${c.userId}`"
        class="card conv-card message-link">
        <div class="conv-avatar" :style="{ background: getColor(c.userId) }">
          <span class="conv-initial">{{ (c.userName || '?')[0] }}</span>
        </div>
        <div class="conv-info">
          <div class="conv-header">
            <span class="conv-name">{{ c.userName }}</span>
            <span class="conv-time">{{ formatTime(c.lastMessageAt) }}</span>
          </div>
          <p class="conv-last">{{ c.lastMessage }}</p>
        </div>
        <div v-if="c.unreadCount > 0" class="unread-count">{{ c.unreadCount }}</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { MessagingService } from "../../application/messaging.service.js";
import AppIcon from "../components/AppIcon.vue";

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();
const conversations = ref([]);
const loading = ref(true);

const baseRoute = computed(() => auth.user?.role === "worker" ? "/worker/messages" : "/client/messages");
const colors = ["#009960","#1A2E4A","#00B272","#00B272","#f59e0b","#ef4444"];
function getColor(id) { return colors[id % colors.length]; }
function formatTime(d) { if (!d) return ""; const dt = new Date(d); return dt.toLocaleDateString("es-PE",{month:"short",day:"numeric"}); }

onMounted(async () => {
  try {
    conversations.value = await MessagingService.getConversations();
  } catch { } finally { loading.value = false; }
});
</script>

<style scoped>
.view-container { max-width: 896px; margin: 0 auto; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; }
.mb-6 { margin-bottom: 1.5rem; }

.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }
.empty-state { text-align: center; padding: 4rem 0; }
.empty-icon { color: #7A8FA6; margin-bottom: 1rem; }
.empty-text { color: #3A4A5C; margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 500; }
.empty-subtext { font-size: 0.875rem; color: #7A8FA6; }

.conv-list { display: flex; flex-direction: column; gap: 0.75rem; }

.conv-card { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
  padding: 1rem; 
  transition: transform 0.2s, box-shadow 0.2s; 
}
.conv-card:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); 
}

.message-link { cursor: pointer; text-decoration: none; }

.conv-avatar { width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.conv-initial { color: white; font-weight: 700; font-size: 1.125rem; }

.conv-info { flex: 1; min-width: 0; }
.conv-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
.conv-name { font-weight: 700; color: #1A2E4A; }
.conv-time { font-size: 0.75rem; color: #7A8FA6; }
.conv-last { font-size: 0.875rem; color: #3A4A5C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }

.unread-count { background: #009960; color: white; border-radius: 9999px; min-width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; padding: 0 6px; }

.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; }
.spinner-lg { width: 36px; height: 36px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
