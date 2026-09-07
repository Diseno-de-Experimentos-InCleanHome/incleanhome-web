<template>
  <div class="view-container max-w-2xl">
    <button @click="$router.back()" class="btn btn-secondary btn-sm mb-4">← {{ t('common.back') }}</button>
    <h1 class="page-title mb-6">{{ t('booking.title') }}</h1>

    <div v-if="workerLoading" class="loader-wrapper"><div class="spinner"></div></div>

    <div v-else class="flex-col gap-5">
      <div class="card flex-row gap-4 worker-summary">
        <div class="worker-avatar-md avatar-blue">
          <span class="avatar-initial">{{ initials }}</span>
        </div>
        <div>
          <div class="worker-name">{{ worker?.name }}</div>
          <div class="worker-rate">S/. {{ worker?.hourlyRate }}/hora</div>
        </div>
      </div>

      <div class="card">
        <label class="label-bold">{{ t('booking.serviceType') }}</label>
        <select v-model="form.serviceType" class="input-field mt-1">
          <option v-for="svc in worker?.serviceTypes || []" :key="svc" :value="svc">{{ t(`worker.services.${svc}`) }}</option>
        </select>
      </div>

      <div class="card">
        <h3 class="card-subtitle"><AppIcon name="calendar" :size="18" /> {{ t('booking.selectDate') }}</h3>
        <div class="calendar">
          <div class="cal-header">
            <button @click="prevMonth" class="cal-nav" aria-label="Mes anterior">‹</button>
            <span class="month-label">{{ monthLabel }}</span>
            <button @click="nextMonth" class="cal-nav" aria-label="Mes siguiente">›</button>
          </div>
          <div class="cal-days">
            <span v-for="d in ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']" :key="d" class="cal-day-label">{{ d }}</span>
          </div>
          <div class="cal-grid">
            <div v-for="blank in startBlank" :key="'b'+blank"></div>
            <button v-for="day in daysInMonth" :key="day" @click="selectDay(day)" :disabled="isPast(day)"
              :class="['cal-day', selectedDay === day ? 'cal-day-selected' : '', isPast(day) ? 'cal-day-disabled' : 'cal-day-active']">
              {{ day }}
            </button>
          </div>
        </div>
        <div class="grid-2-cols gap-3 mt-4">
          <div class="form-group">
            <label class="label-bold">{{ t('booking.startTime') }}</label>
            <select v-model="form.startTime" class="input-field" @change="calcHours">
              <option v-for="h in timeSlots" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label-bold">{{ t('booking.endTime') }}</label>
            <select v-model="form.endTime" class="input-field" @change="calcHours">
              <option v-for="h in timeSlots" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
        </div>
        <div v-if="form.hours > 0" class="hours-info">{{ form.hours }} {{ t('booking.hours') }}</div>
      </div>

      <div class="card">
        <label class="label-bold">{{ t('booking.address') }}</label>
        <input v-model="form.address" type="text" class="input-field mt-1" :placeholder="t('booking.address')" />
        <label class="label-bold mt-label">{{ t('booking.notes') }}</label>
        <textarea v-model="form.notes" class="input-field mt-1 no-resize" rows="2"></textarea>
      </div>

      <div class="card summary-card">
        <h3 class="card-title mb-4">Resumen</h3>
        <div class="summary-row"><span>{{ form.hours }}h × S/. {{ worker?.hourlyRate }}</span><span>S/. {{ totalAmount.toFixed(2) }}</span></div>
        <div class="summary-total">
          <span class="total-label">{{ t('booking.total') }}</span>
          <span class="total-amount">S/. {{ totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <div class="card disclaimer-card">
        <p class="disclaimer-text"><AppIcon name="infoCircle" :size="16" /> {{ t('booking.paymentDisclaimer') }}</p>
      </div>

      <div v-if="error" class="alert error-box">{{ error }}</div>

      <button @click="handleBook" class="btn btn-primary btn-full btn-lg mt-4" :disabled="!canBook || submitting">
        <div v-if="submitting" class="spinner spinner-sm"></div>
        {{ submitting ? t('common.loading') : t('booking.confirm') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useToastStore } from "../../../Shared/application/toast.store.js";
import { BookingService } from "../../application/booking.service.js";
import { BookingPricingService } from "../../domain/services/booking-pricing.service.js";
import { CatalogService } from "../../../SearchAndCatalog/application/catalog.service.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const worker = ref(null);
const workerLoading = ref(true);
const submitting = ref(false);
const error = ref("");

const today = new Date();
const viewYear = ref(today.getFullYear());
const viewMonth = ref(today.getMonth());
const selectedDay = ref(null);

const form = ref({ serviceType: "", startTime: "08:00", endTime: "10:00", address: "", notes: "", hours: 2 });

const initials = computed(() => worker.value?.name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() || "?");
const totalAmount = computed(() => BookingPricingService.calculateTotal(worker.value?.hourlyRate || 0, form.value.hours));
const canBook = computed(() => selectedDay.value && form.value.serviceType && form.value.address && form.value.hours > 0);

const monthLabel = computed(() => new Date(viewYear.value, viewMonth.value).toLocaleDateString("es-PE", { month:"long", year:"numeric" }));
const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0).getDate());
const startBlank = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay());
const timeSlots = Array.from({ length: 18 }, (_, i) => `${String(Math.floor(i + 6)).padStart(2,"0")}:00`);

function prevMonth() { if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; } else viewMonth.value--; }
function nextMonth() { if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; } else viewMonth.value++; }
function selectDay(d) { selectedDay.value = d; }
function isPast(d) {
  const date = new Date(viewYear.value, viewMonth.value, d);
  return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}
function calcHours() {
  const [sh, sm] = form.value.startTime.split(":").map(Number);
  const [eh, em] = form.value.endTime.split(":").map(Number);
  form.value.hours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}
async function handleBook() {
  submitting.value = true;
  error.value = "";
  try {
    const dateStr = `${viewYear.value}-${String(viewMonth.value+1).padStart(2,"0")}-${String(selectedDay.value).padStart(2,"0")}`;
    await BookingService.create({
      workerId: parseInt(route.params.id),
      serviceType: form.value.serviceType,
      date: dateStr,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      hours: form.value.hours,
      address: form.value.address,
      notes: form.value.notes,
    });
    toast.success(t("booking.bookingSuccess"));
    router.push("/client/bookings");
  } catch (e) {
    error.value = e.response?.data?.error || t("common.error");
  } finally { submitting.value = false; }
}

onMounted(async () => {
  const id = route.params.id;
  const w = await CatalogService.getWorker(id);
  worker.value = w;
  if (w.serviceTypes?.length) form.value.serviceType = w.serviceTypes[0];
  workerLoading.value = false;
});
</script>

<style scoped>
.view-container { padding: 1rem; margin: 0 auto; }
.max-w-2xl { max-width: 672px; }
@media (min-width: 640px) { .view-container { padding: 2rem 0; } }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 0.75rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 2rem 0; }
.flex-col { display: flex; flex-direction: column; }
.flex-row { display: flex; align-items: center; }
.gap-5 { gap: 1.25rem; }
.gap-4 { gap: 1rem; }
.gap-3 { gap: 0.75rem; }
.worker-avatar-md { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.avatar-blue { background: #009960; }
.avatar-initial { color: white; font-weight: 700; font-size: 1.25rem; }
.worker-summary { padding: 1rem; }
.worker-name { font-weight: 700; color: #1A2E4A; font-size: 1.125rem; }
.worker-rate { font-size: 0.875rem; color: #3A4A5C; }
.card-subtitle { font-weight: 600; color: #1A2E4A; margin-bottom: 1rem; font-size: 1.125rem; display: flex; align-items: center; gap: 0.5rem; }
.card-title { font-weight: 700; color: #1A2E4A; font-size: 1.25rem; }
.label-bold { font-size: 0.875rem; font-weight: 600; color: #3A4A5C; display: block; }
.mt-1 { margin-top: 0.25rem; }
.mt-4 { margin-top: 1rem; }
.calendar { border: 1px solid #c5e8d8; border-radius: 0.75rem; overflow: hidden; }
.cal-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #E6F9F2; border-bottom: 1px solid #c5e8d8; }
.cal-nav { background: none; border: none; cursor: pointer; font-size: 1.25rem; color: #3A4A5C; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.cal-nav:hover { background: #c5e8d8; }
.month-label { font-weight: 600; color: #1A2E4A; }
.cal-days { display: grid; grid-template-columns: repeat(7, 1fr); padding: 0.5rem 0.5rem 0; }
.cal-day-label { text-align: center; font-size: 0.75rem; font-weight: 600; color: #7A8FA6; padding: 0.25rem; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; padding: 0.5rem; }
.cal-day { height: 34px; border-radius: 6px; border: none; background: none; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.1s; }
.cal-day-active:hover { background: #E6F9F2; color: #009960; }
.cal-day-selected { background: #009960 !important; color: white !important; }
.cal-day-disabled { color: #7A8FA6; cursor: not-allowed; }
.grid-2-cols { display: grid; grid-template-columns: 1fr; }
@media (min-width: 480px) { .grid-2-cols { grid-template-columns: repeat(2, 1fr); } }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.hours-info { margin-top: 0.75rem; padding: 0.75rem; background: #E6F9F2; border-radius: 0.5rem; font-size: 0.875rem; color: #009960; font-weight: 600; }
.mt-label { margin-top: 1rem; }
.no-resize { resize: none; }
.summary-card { background: #E6F9F2; border-color: #00B272; }
.summary-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.9375rem; margin-bottom: 0.375rem; color: #3A4A5C; }
.summary-total { border-top: 1px solid #00B272; margin-top: 0.75rem; padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
.total-label { font-weight: 700; font-size: 1.0625rem; color: #009960; }
.total-amount { font-weight: 800; font-size: 1.25rem; color: #009960; }
.disclaimer-card { background: #FFF7E6; border-color: #F5C453; }
.disclaimer-text { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.875rem; color: #7A5C10; line-height: 1.5; }
.alert { padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; margin-top: 1rem; }
.error-box { background: #fee2e2; color: #991b1b; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; }
.spinner-sm { width: 18px; height: 18px; border-width: 2px; display: inline-block; margin-right: 0.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
