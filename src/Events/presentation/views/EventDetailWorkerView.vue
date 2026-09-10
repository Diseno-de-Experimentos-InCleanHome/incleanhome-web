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

        <p class="client-line">{{ t('events.publishedBy') }} <strong>{{ event.clientName }}</strong></p>
        <p v-if="event.description" class="description">{{ event.description }}</p>

        <div class="meta-grid">
          <div class="meta-item"><AppIcon name="calendar" :size="16" /> {{ event.date }}</div>
          <div class="meta-item"><AppIcon name="clock" :size="16" /> {{ event.startTime }} – {{ event.endTime }} ({{ event.hours }}h)</div>
          <div class="meta-item"><AppIcon name="pin" :size="16" /> {{ t(`worker.zones.${event.zone}`) }} — {{ event.address }}</div>
          <div class="meta-item"><AppIcon name="users" :size="16" /> {{ event.acceptedCount }}/{{ event.workersNeeded }} {{ t('events.workersNeeded') }}</div>
          <div class="meta-item"><AppIcon name="coin" :size="16" /> S/. {{ event.hourlyRateOffered }}/{{ t('search.perHour') }}</div>
          <div class="meta-item"><AppIcon name="clock" :size="16" /> {{ t('events.applicationDeadline') }}: {{ formatDeadline(event.applicationDeadline) }}</div>
        </div>
      </div>

      <div class="card disclaimer-card mb-5">
        <p class="disclaimer-text"><AppIcon name="infoCircle" :size="16" /> {{ t('booking.paymentDisclaimer') }}</p>
      </div>

      <div v-if="event.myApplicationStatus" class="card status-card">
        <h3 class="card-title">{{ t('events.myApplication') }}</h3>
        <span :class="appStatusBadge(event.myApplicationStatus)">{{ t(`events.applicationStatus.${event.myApplicationStatus}`) }}</span>
        <div v-if="event.myApplicationStatus === 'pending'" class="action-row">
          <button @click="handleWithdraw" class="btn btn-danger btn-sm">{{ t('events.withdraw') }}</button>
        </div>
      </div>

      <div v-else-if="event.status === 'open' && !deadlinePassed" class="card apply-card">
        <h3 class="card-title">{{ t('events.applyToEvent') }}</h3>
        <textarea v-model="message" class="input-field no-resize" rows="3" :placeholder="t('events.messagePlaceholder')"></textarea>
        <div v-if="error" class="alert error-box">{{ error }}</div>
        <button @click="handleApply" class="btn btn-primary btn-full mt-3" :disabled="applying">
          <div v-if="applying" class="spinner spinner-sm"></div>
          {{ applying ? t('common.loading') : t('events.applyToEvent') }}
        </button>
      </div>

      <div v-else class="card empty-state">
        <AppIcon name="emptyBox" :size="40" class="empty-icon" />
        <p class="empty-text">{{ t('events.notOpenForApplications') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
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
const loading = ref(true);
const applying = ref(false);
const error = ref("");
const message = ref("");
let myApplicationId = null;

function statusBadge(s) {
  return { open: "badge badge-yellow", staffed: "badge badge-blue", in_progress: "badge badge-blue", completed: "badge badge-green", cancelled: "badge badge-gray" }[s] || "badge badge-gray";
}
function appStatusBadge(s) {
  return { pending: "badge badge-yellow", accepted: "badge badge-green", rejected: "badge badge-red", withdrawn: "badge badge-gray" }[s] || "badge badge-gray";
}
function formatDeadline(iso) {
  return new Date(iso).toLocaleString();
}

const deadlinePassed = computed(() =>
  event.value ? new Date(event.value.applicationDeadline) <= new Date() : false
);

async function load() {
  const id = route.params.id;
  event.value = await EventService.getById(id);
  myApplicationId = event.value.myApplicationStatus ? await resolveMyApplicationId() : null;
}

/** El detalle del evento solo trae el estado de mi postulación, no su id: lo buscamos aparte. */
async function resolveMyApplicationId() {
  const mine = await EventApplicationService.listMine();
  return mine.find(a => a.eventId === Number(route.params.id))?.id ?? null;
}

async function handleApply() {
  applying.value = true;
  error.value = "";
  try {
    await EventApplicationService.apply(event.value.id, message.value);
    toast.success(t('events.applySuccess'));
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error');
  } finally {
    applying.value = false;
  }
}

async function handleWithdraw() {
  try {
    // Sin id no hay nada que retirar: mandarlo igual arma /applications/null/withdraw,
    // que la restricción {appId:int} responde con un 404.
    if (myApplicationId === null) myApplicationId = await resolveMyApplicationId();
    if (myApplicationId === null) {
      toast.error(t('common.error'));
      return;
    }
    await EventApplicationService.withdraw(event.value.id, myApplicationId);
    toast.success(t('events.withdrawSuccess'));
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
.mt-3 { margin-top: 0.75rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }
.spinner-lg { width: 36px; height: 36px; }
.spinner-sm { width: 18px; height: 18px; border-width: 2px; display: inline-block; margin-right: 0.5rem; }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.event-title { font-size: 1.375rem; font-weight: 800; color: #1A2E4A; margin-bottom: 0.5rem; }
.event-services { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.svc-chip { font-size: 0.75rem; background: #E6F9F2; color: #009960; padding: 0.125rem 0.5rem; border-radius: 9999px; font-weight: 600; }
.client-line { font-size: 0.875rem; color: #3A4A5C; margin-top: 0.75rem; }
.description { color: #3A4A5C; margin-top: 0.5rem; font-size: 0.9375rem; line-height: 1.5; }
.meta-grid { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; font-size: 0.875rem; color: #3A4A5C; }
.meta-item { display: flex; align-items: center; gap: 0.375rem; }
.disclaimer-card { background: #FFF7E6; border-color: #F5C453; }
.disclaimer-text { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.875rem; color: #7A5C10; line-height: 1.5; }
.card-title { font-weight: 700; color: #1A2E4A; font-size: 1.0625rem; margin-bottom: 0.75rem; }
.action-row { margin-top: 1rem; }
.no-resize { resize: none; }
.alert { padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; margin-top: 0.75rem; }
.error-box { background: #fee2e2; color: #991b1b; }
.empty-state { text-align: center; padding: 2rem 0; }
.empty-icon { color: #7A8FA6; margin-bottom: 0.75rem; }
.empty-text { color: #3A4A5C; }
</style>
