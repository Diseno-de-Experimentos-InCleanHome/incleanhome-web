<template>
  <div class="view-container max-w-2xl">
    <button @click="$router.back()" class="btn btn-secondary btn-sm mb-4">← {{ t('common.back') }}</button>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <template v-else-if="event">
      <div class="card mb-5">
        <div class="detail-header">
          <div>
            <h1 class="event-title">{{ event.title }}</h1>
            <div class="event-services">
              <span v-for="svc in event.serviceTypes" :key="svc" class="svc-chip">{{ t(`worker.services.${svc}`) }}</span>
            </div>
          </div>
          <span :class="statusBadge(event.status)">{{ t(`events.status.${event.status}`) }}</span>
        </div>

        <p v-if="event.description" class="description">{{ event.description }}</p>

        <div class="meta-grid">
          <div class="meta-item"><AppIcon name="calendar" :size="16" /> {{ event.date }}</div>
          <div class="meta-item"><AppIcon name="clock" :size="16" /> {{ event.startTime }} – {{ event.endTime }} ({{ event.hours }}h)</div>
          <div class="meta-item"><AppIcon name="pin" :size="16" /> {{ t(`worker.zones.${event.zone}`) }} — {{ event.address }}</div>
          <div class="meta-item"><AppIcon name="users" :size="16" /> {{ event.acceptedCount }}/{{ event.workersNeeded }} {{ t('events.workersNeeded') }}</div>
          <div class="meta-item"><AppIcon name="coin" :size="16" /> S/. {{ event.hourlyRateOffered }}/{{ t('search.perHour') }}</div>
          <div class="meta-item"><AppIcon name="clock" :size="16" /> {{ t('events.applicationDeadline') }}: {{ formatDeadline(event.applicationDeadline) }}</div>
        </div>

        <div class="action-row" v-if="event.status === 'open' || event.status === 'staffed'">
          <button v-if="event.status === 'open' || event.status === 'staffed'" @click="handleCancel" class="btn btn-danger btn-sm">{{ t('events.cancelEvent') }}</button>
          <button v-if="event.status === 'staffed' && !isFuture(event.date)" @click="handleComplete" class="btn btn-success btn-sm"><AppIcon name="check" :size="15" /> {{ t('events.completeEvent') }}</button>
        </div>
      </div>

      <h2 class="section-title">{{ t('events.applicants') }} ({{ applications.length }})</h2>

      <div v-if="!applications.length" class="card empty-state">
        <AppIcon name="emptyBox" :size="40" class="empty-icon" />
        <p class="empty-text">{{ t('events.noApplicants') }}</p>
      </div>

      <div v-else class="app-list">
        <div v-for="a in applications" :key="a.id" class="card app-card">
          <div class="app-header">
            <div class="worker-info">
              <div class="avatar-sm avatar-aqua"><span class="avatar-initial">{{ (a.workerName || 'W')[0] }}</span></div>
              <div class="worker-name">{{ a.workerName }}</div>
            </div>
            <span :class="appStatusBadge(a.status)">{{ t(`events.applicationStatus.${a.status}`) }}</span>
          </div>
          <p v-if="a.message" class="app-message"><AppIcon name="chat" :size="14" /> {{ a.message }}</p>
          <div v-if="a.status === 'pending' && event.status === 'open'" class="action-row">
            <button @click="handleReject(a)" class="btn btn-danger btn-sm">{{ t('common.reject') }}</button>
            <button @click="handleAccept(a)" class="btn btn-success btn-sm">{{ t('common.accept') }}</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useToastStore } from "../../../Shared/application/toast.store.js";
import { EventService } from "../../application/event.service.js";
import { EventApplicationService } from "../../application/event-application.service.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const route = useRoute();
const toast = useToastStore();

const event = ref(null);
const applications = ref([]);
const loading = ref(true);

function statusBadge(s) {
  return { open: "badge badge-yellow", staffed: "badge badge-blue", in_progress: "badge badge-blue", completed: "badge badge-green", cancelled: "badge badge-gray" }[s] || "badge badge-gray";
}
function appStatusBadge(s) {
  return { pending: "badge badge-yellow", accepted: "badge badge-green", rejected: "badge badge-red", withdrawn: "badge badge-gray" }[s] || "badge badge-gray";
}
function isFuture(dateStr) {
  return new Date(dateStr) > new Date(new Date().toDateString());
}
function formatDeadline(iso) {
  return new Date(iso).toLocaleString();
}

async function load() {
  const id = route.params.id;
  const [ev, apps] = await Promise.all([
    EventService.getById(id),
    EventApplicationService.listByEvent(id),
  ]);
  event.value = ev;
  applications.value = apps;
}

async function handleCancel() {
  try {
    event.value = await EventService.cancel(event.value.id);
    toast.success(t('events.cancelSuccess'));
  } catch (e) {
    toast.error(e.response?.data?.error || t('common.error'));
  }
}

async function handleComplete() {
  try {
    event.value = await EventService.complete(event.value.id);
    toast.success(t('events.completeSuccess'));
  } catch (e) {
    toast.error(e.response?.data?.error || t('common.error'));
  }
}

async function handleAccept(a) {
  try {
    await EventApplicationService.accept(event.value.id, a.id);
    toast.success(t('events.applicantAccepted'));
    await load();
  } catch (e) {
    toast.error(e.response?.data?.error || t('common.error'));
  }
}

async function handleReject(a) {
  try {
    await EventApplicationService.reject(event.value.id, a.id);
    toast.success(t('events.applicantRejected'));
    await load();
  } catch (e) {
    toast.error(e.response?.data?.error || t('common.error'));
  }
}

onMounted(async () => {
  loading.value = true;
  try { await load(); } finally { loading.value = false; }
});
</script>

<style scoped>
.view-container { padding: 1rem; margin: 0 auto; }
.max-w-2xl { max-width: 672px; }
@media (min-width: 640px) { .view-container { padding: 2rem 0; } }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 1.25rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }
.spinner-lg { width: 36px; height: 36px; }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.event-title { font-size: 1.375rem; font-weight: 800; color: #1A2E4A; margin-bottom: 0.5rem; }
.event-services { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.svc-chip { font-size: 0.75rem; background: #E6F9F2; color: #009960; padding: 0.125rem 0.5rem; border-radius: 9999px; font-weight: 600; }
.description { color: #3A4A5C; margin-top: 0.875rem; font-size: 0.9375rem; line-height: 1.5; }
.meta-grid { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; font-size: 0.875rem; color: #3A4A5C; }
.meta-item { display: flex; align-items: center; gap: 0.375rem; }
.action-row { display: flex; gap: 0.5rem; margin-top: 1.25rem; border-top: 1px solid #E6F9F2; padding-top: 1rem; }
.section-title { font-weight: 700; font-size: 1.125rem; color: #1A2E4A; margin-bottom: 0.875rem; }
.empty-state { text-align: center; padding: 2rem 0; }
.empty-icon { color: #7A8FA6; margin-bottom: 0.75rem; }
.empty-text { color: #3A4A5C; }
.app-list { display: flex; flex-direction: column; gap: 0.75rem; }
.app-card { padding: 1rem 1.25rem; }
.app-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.worker-info { display: flex; align-items: center; gap: 0.625rem; }
.avatar-sm { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.avatar-aqua { background: #00B272; }
.avatar-initial { color: white; font-size: 0.8125rem; font-weight: 700; }
.worker-name { font-weight: 700; color: #1A2E4A; font-size: 0.9375rem; }
.app-message { display: flex; align-items: flex-start; gap: 0.375rem; font-size: 0.875rem; color: #3A4A5C; margin-top: 0.625rem; background: #E6F9F2; padding: 0.625rem; border-radius: 0.5rem; }
.app-message .app-icon { margin-top: 0.125rem; }
</style>
