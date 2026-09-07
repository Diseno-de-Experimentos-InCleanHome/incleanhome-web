<template>
  <div class="view-container max-w-2xl">
    <button @click="$router.back()" class="btn btn-secondary btn-sm mb-4">← {{ t('common.back') }}</button>
    <h1 class="page-title mb-6">{{ t('events.createTitle') }}</h1>

    <div class="flex-col gap-5">
      <div class="card">
        <label class="label">{{ t('events.eventTitle') }}</label>
        <input v-model="form.title" type="text" class="input-field mt-1" :placeholder="t('events.eventTitlePlaceholder')" />
        <label class="label mt-label">{{ t('events.description') }}</label>
        <textarea v-model="form.description" class="input-field mt-1 no-resize" rows="3"></textarea>
      </div>

      <div class="card">
        <label class="label">{{ t('worker.serviceTypes') }}</label>
        <div class="checkbox-group mt-1">
          <label v-for="svc in serviceOptions" :key="svc.value" class="checkbox-label">
            <input type="checkbox" :value="svc.value" v-model="form.serviceTypes" />
            <span class="svc-label">{{ svc.label }}</span>
          </label>
        </div>
      </div>

      <div class="card">
        <div class="grid-2-cols gap-3">
          <div class="form-group">
            <label class="label">{{ t('search.zone') }}</label>
            <select v-model="form.zone" class="input-field">
              <option value="" disabled>{{ t('search.zone') }}</option>
              <option v-for="z in zoneOptions" :key="z.value" :value="z.value">{{ z.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">{{ t('booking.address') }}</label>
            <input v-model="form.address" type="text" class="input-field" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="grid-2-cols gap-3">
          <div class="form-group">
            <label class="label">{{ t('events.eventDate') }}</label>
            <input v-model="form.date" type="date" :min="today" class="input-field" />
          </div>
          <div class="form-group">
            <label class="label">{{ t('events.workersNeeded') }}</label>
            <input v-model.number="form.workersNeeded" type="number" min="1" class="input-field" />
          </div>
        </div>
        <div class="grid-2-cols gap-3 mt-3">
          <div class="form-group">
            <label class="label">{{ t('booking.startTime') }}</label>
            <input v-model="form.startTime" type="time" class="input-field" @change="calcHours" />
          </div>
          <div class="form-group">
            <label class="label">{{ t('booking.endTime') }}</label>
            <input v-model="form.endTime" type="time" class="input-field" @change="calcHours" />
          </div>
        </div>
        <div v-if="form.hours > 0" class="hours-info">{{ form.hours }} {{ t('booking.hours') }}</div>
      </div>

      <div class="card">
        <div class="grid-2-cols gap-3">
          <div class="form-group">
            <label class="label">{{ t('events.hourlyRateOffered') }}</label>
            <input v-model.number="form.hourlyRateOffered" type="number" min="10" step="5" class="input-field" />
          </div>
          <div class="form-group">
            <label class="label">{{ t('events.applicationDeadline') }}</label>
            <input v-model="form.applicationDeadline" type="datetime-local" class="input-field" />
          </div>
        </div>
      </div>

      <div v-if="error" class="alert error-box">{{ error }}</div>

      <button @click="handleCreate" class="btn btn-primary btn-full btn-lg" :disabled="!canCreate || submitting">
        <div v-if="submitting" class="spinner spinner-sm"></div>
        {{ submitting ? t('common.loading') : t('events.publish') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useToastStore } from "../../../Shared/application/toast.store.js";
import { EventService } from "../../application/event.service.js";
import { buildServiceOptions } from "../../../Shared/domain/constants/services.js";
import { buildZoneOptions } from "../../../Shared/domain/constants/zones.js";

const { t } = useI18n();
const router = useRouter();
const toast = useToastStore();

const submitting = ref(false);
const error = ref("");
const today = new Date().toISOString().slice(0, 10);

const form = ref({
  title: "", description: "", serviceTypes: [], zone: "", address: "",
  date: "", startTime: "09:00", endTime: "13:00", hours: 4,
  workersNeeded: 2, hourlyRateOffered: 25, applicationDeadline: "",
});

const serviceOptions = computed(() => buildServiceOptions(t));
const zoneOptions = computed(() => buildZoneOptions(t));

const canCreate = computed(() =>
  form.value.title && form.value.serviceTypes.length > 0 && form.value.zone &&
  form.value.address && form.value.date && form.value.workersNeeded >= 1 &&
  form.value.hours > 0 && form.value.applicationDeadline
);

function calcHours() {
  if (!form.value.startTime || !form.value.endTime) return;
  const [sh, sm] = form.value.startTime.split(":").map(Number);
  const [eh, em] = form.value.endTime.split(":").map(Number);
  form.value.hours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

async function handleCreate() {
  submitting.value = true;
  error.value = "";
  try {
    const ev = await EventService.create({
      title: form.value.title,
      description: form.value.description,
      serviceTypes: form.value.serviceTypes,
      zone: form.value.zone,
      address: form.value.address,
      date: form.value.date,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      hours: form.value.hours,
      workersNeeded: form.value.workersNeeded,
      hourlyRateOffered: form.value.hourlyRateOffered,
      // Sent as the literal picked wall-clock value (no timezone shift), matching how
      // date/startTime are treated: naive local values, never converted to true UTC.
      applicationDeadline: `${form.value.applicationDeadline}:00.000Z`,
    });
    toast.success(t("events.createSuccess"));
    router.push(`/client/events/${ev.id}`);
  } catch (e) {
    error.value = e.response?.data?.error || t("common.error");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.view-container { padding: 1rem; margin: 0 auto; }
.max-w-2xl { max-width: 672px; }
@media (min-width: 640px) { .view-container { padding: 2rem 0; } }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.flex-col { display: flex; flex-direction: column; }
.gap-5 { gap: 1.25rem; }
.gap-3 { gap: 0.75rem; }
.grid-2-cols { display: grid; grid-template-columns: 1fr; }
@media (min-width: 480px) { .grid-2-cols { grid-template-columns: repeat(2, 1fr); } }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-label { margin-top: 1rem; }
.no-resize { resize: none; }
.checkbox-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.checkbox-label { display: flex; align-items: center; gap: 0.375rem; cursor: pointer; }
.svc-label { font-size: 0.8125rem; color: #3A4A5C; }
.hours-info { margin-top: 0.75rem; padding: 0.75rem; background: #E6F9F2; border-radius: 0.5rem; font-size: 0.875rem; color: #009960; font-weight: 600; }
.alert { padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }
.error-box { background: #fee2e2; color: #991b1b; }
.spinner-sm { width: 18px; height: 18px; border-width: 2px; display: inline-block; margin-right: 0.5rem; }
</style>
