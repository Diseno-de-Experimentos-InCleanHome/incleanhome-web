<template>
  <div class="view-container">
    <div class="view-header mb-6">
      <h1 class="page-title">{{ t('events.myEvents') }}</h1>
      <router-link to="/client/events/new" class="btn btn-primary btn-sm">+ {{ t('events.publish') }}</router-link>
    </div>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <div v-else-if="!events.length" class="card empty-state">
      <AppIcon name="emptyBox" :size="44" class="empty-icon" />
      <p class="empty-text">{{ t('events.noEvents') }}</p>
      <router-link to="/client/events/new" class="btn btn-primary submit-btn">{{ t('events.publish') }}</router-link>
    </div>

    <div v-else class="event-list">
      <div class="tabs-container">
        <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
          :class="['btn btn-sm', activeTab === tab.value ? 'btn-primary' : 'btn-secondary']">
          {{ tab.label }} <span v-if="tabCount(tab.value)" class="tab-badge" :class="activeTab === tab.value ? 'badge-active' : 'badge-inactive'">{{ tabCount(tab.value) }}</span>
        </button>
      </div>

      <EventCard v-for="e in filteredEvents" :key="e.id" :event="e" base-path="/client/events" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { EventService } from "../../application/event.service.js";
import EventCard from "../components/EventCard.vue";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const events = ref([]);
const loading = ref(true);
const activeTab = ref("open");

const tabs = computed(() => [
  { value: "open", label: t('events.status.open') },
  { value: "staffed", label: t('events.status.staffed') },
  { value: "completed", label: t('events.status.completed') },
  { value: "cancelled", label: t('events.status.cancelled') },
  { value: "all", label: t('events.allTab') },
]);

const filteredEvents = computed(() =>
  activeTab.value === "all" ? events.value : events.value.filter(e => e.status === activeTab.value)
);
const tabCount = (tab) => tab === "all" ? events.value.length : events.value.filter(e => e.status === tab).length;

onMounted(async () => {
  try {
    events.value = await EventService.listMine();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; }
.view-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; }
.mb-6 { margin-bottom: 1.5rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }
.empty-state { text-align: center; padding: 4rem 0; }
.empty-icon { color: #7A8FA6; margin-bottom: 1rem; }
.empty-text { color: #3A4A5C; margin-bottom: 1.5rem; }
.submit-btn { display: inline-block; }
.event-list { display: flex; flex-direction: column; gap: 1rem; }
.tabs-container { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.tab-badge { display: inline-flex; align-items: center; justify-content: center; padding: 0.1rem 0.4rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-left: 0.25rem; }
.badge-active { background: white; color: #009960; }
.badge-inactive { background: #c5e8d8; color: #3A4A5C; }
.spinner-lg { width: 36px; height: 36px; }
</style>
