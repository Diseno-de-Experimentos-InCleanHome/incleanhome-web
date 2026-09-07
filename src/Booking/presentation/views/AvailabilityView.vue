<template>
  <div class="view-container max-w-2xl">
    <h1 class="page-title mb-2">{{ t('nav.availability') }}</h1>
    <p class="page-subtitle mb-6">Configura los días y horarios en que puedes trabajar</p>

    <div class="card">
      <div class="day-list">
        <div v-for="(day, index) in days" :key="index" class="day-row">
          <div class="day-toggle-container">
            <!-- Toggle -->
            <button @click="toggleDay(index)"
              :class="['toggle', slots[index]?.isAvailable ? 'toggle-on' : 'toggle-off']">
              <div :class="['toggle-knob', slots[index]?.isAvailable ? 'knob-on' : 'knob-off']"></div>
            </button>
            <span class="day-label">{{ day }}</span>
          </div>

          <div v-if="slots[index]?.isAvailable" class="time-select-container">
            <select v-model="slots[index].startTime" class="input-field time-select">
              <option v-for="h in timeSlots" :key="h" :value="h">{{ h }}</option>
            </select>
            <span class="until-text">hasta</span>
            <select v-model="slots[index].endTime" class="input-field time-select">
              <option v-for="h in timeSlots" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
          <div v-else class="unavailable-text">No disponible</div>
        </div>
      </div>

      <div v-if="error" class="alert error-box">{{ error }}</div>

        <button @click="saveAvailability" class="btn btn-primary btn-full submit-btn" :disabled="saving">
            <div v-if="saving" class="spinner spinner-sm"></div>
        {{ saving ? t('common.loading') : t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { useToastStore } from "../../../Shared/application/toast.store.js";
import { AvailabilityService } from "../../application/availability.service.js";

const { t } = useI18n();
const auth = useAuthStore();
const toast = useToastStore();

const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const timeSlots = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2,"0")}:00`);
const saving = ref(false);
const error = ref("");
const slots = ref([]);

async function toggleDay(index) {
  slots.value[index].isAvailable = !slots.value[index].isAvailable;
}

async function saveAvailability() {
  saving.value = true;
  error.value = "";
  try {
    await AvailabilityService.save(auth.user?.id, slots.value);
    toast.success(t("common.success"));
  } catch (e) {
    error.value = e.response?.data?.error || t("common.error");
  } finally { saving.value = false; }
}

onMounted(async () => {
  slots.value = await AvailabilityService.get(auth.user?.id);
});
</script>

<style scoped>
.view-container {
  padding: 1rem;
  margin: 0 auto;
}
.max-w-2xl { max-width: 672px; }
@media (min-width: 640px) {
  .view-container { padding: 2rem 0; }
}

.page-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #1A2E4A;
}
.mb-2 { margin-bottom: 0.5rem; }
.mb-6 { margin-bottom: 1.5rem; }
.page-subtitle { color: #3A4A5C; font-size: 1.125rem; }

.day-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-row { display:flex;align-items:center;gap:1rem;padding:0.75rem 0;border-bottom:1px solid #E6F9F2; flex-wrap: wrap; }
@media (min-width: 640px) {
  .day-row { flex-wrap: nowrap; }
}
.day-row:last-child { border-bottom:none; }

.day-toggle-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}
@media (min-width: 640px) {
  .day-toggle-container { width: auto; min-width: 160px; }
}

.toggle { width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0; }
.toggle-on { background:#009960; }
.toggle-off { background:#c5e8d8; }
.toggle-knob { width:18px;height:18px;border-radius:50%;background:white;position:absolute;top:3px;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2); }
.knob-on { left:23px; }
.knob-off { left:3px; }
.day-label { font-weight:600; color:#1A2E4A; }

.time-select-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  width: 100%;
}
@media (min-width: 640px) {
  .time-select-container { width: auto; }
}

.time-select { flex: 1; min-width: 100px; }
.until-text { color:#7A8FA6; font-size:0.875rem; }
.unavailable-text { flex:1; font-size:0.875rem; color:#7A8FA6; }

.alert { padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; margin-top: 1rem; }
.error-box { background:#fee2e2; color:#991b1b; }

.submit-btn {
  margin-top: 1.5rem;
}

.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:28px; height:28px; animation: spin 1s linear infinite; }
.spinner-sm { width:18px; height:18px; border-width:2px; display: inline-block; margin-right: 0.5rem; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
