<template>
  <div class="view-container">
    <h1 class="page-title mb-6">{{ t('events.myApplications') }}</h1>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <div v-else-if="!applications.length" class="card empty-state">
      <AppIcon name="emptyBox" :size="44" class="empty-icon" />
      <p class="empty-text">{{ t('events.noApplications') }}</p>
      <router-link to="/worker/events" class="btn btn-primary submit-btn">{{ t('events.availableEvents') }}</router-link>
    </div>

    <div v-else class="app-list">
      <router-link v-for="a in applications" :key="a.id" :to="`/worker/events/${a.eventId}`" class="card app-card">
        <div class="app-header">
          <div>
            <div class="event-title">{{ a.eventTitle }}</div>
            <div class="meta-row">
              <span class="meta-item"><AppIcon name="calendar" :size="14" /> {{ a.eventDate }}</span>
              <span class="meta-item"><AppIcon name="pin" :size="14" /> {{ t(`worker.zones.${a.eventZone}`) }}</span>
            </div>
          </div>
          <span :class="appStatusBadge(a.status)">{{ t(`events.applicationStatus.${a.status}`) }}</span>
        </div>
        <p v-if="a.message" class="app-message"><AppIcon name="chat" :size="14" /> {{ a.message }}</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { EventApplicationService } from "../../application/event-application.service.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const applications = ref([]);
const loading = ref(true);

function appStatusBadge(s) {
  return { pending: "badge badge-yellow", accepted: "badge badge-green", rejected: "badge badge-red", withdrawn: "badge badge-gray" }[s] || "badge badge-gray";
}

onMounted(async () => {
  try {
    applications.value = await EventApplicationService.listMine();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; }
.mb-6 { margin-bottom: 1.5rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }
.spinner-lg { width: 36px; height: 36px; }
.empty-state { text-align: center; padding: 4rem 0; }
.empty-icon { color: #7A8FA6; margin-bottom: 1rem; }
.empty-text { color: #3A4A5C; margin-bottom: 1.5rem; }
.submit-btn { display: inline-block; }
.app-list { display: flex; flex-direction: column; gap: 1rem; }
.app-card { display: block; text-decoration: none; color: inherit; transition: border-color 0.15s, transform 0.15s; }
.app-card:hover { border-color: #009960; transform: translateY(-2px); }
.app-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.event-title { font-weight: 700; color: #1A2E4A; font-size: 1.0625rem; margin-bottom: 0.375rem; }
.meta-row { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.875rem; color: #3A4A5C; }
.meta-item { display: flex; align-items: center; gap: 0.25rem; }
.app-message { display: flex; align-items: flex-start; gap: 0.375rem; font-size: 0.875rem; color: #3A4A5C; margin-top: 0.75rem; background: #E6F9F2; padding: 0.625rem; border-radius: 0.5rem; }
</style>
