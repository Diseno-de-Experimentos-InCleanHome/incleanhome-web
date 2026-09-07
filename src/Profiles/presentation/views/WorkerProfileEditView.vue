<template>
  <div class="view-container">
    <div class="view-header">
      <h1 class="page-title">{{ t('nav.profile') }}</h1>
    </div>

    <div v-if="loading" class="loader-wrapper">
      <div class="spinner spinner-lg"></div>
    </div>

    <div v-else class="card profile-card">
      <div class="profile-header">
        <div class="profile-avatar avatar-purple">
          <span class="avatar-initial">{{ initials }}</span>
        </div>
        <h2 class="profile-name">{{ auth.user?.name }}</h2>
        <span class="badge badge-purple">{{ t('auth.worker') }}</span>
      </div>

      <div class="form-group-list">
        <div class="grid-2-cols">
          <div class="form-group">
            <label class="label-bold">{{ t('auth.name') }}</label>
            <input v-model="form.name" class="input-field" />
          </div>
          <div class="form-group">
            <label class="label-bold">{{ t('auth.phone') }}</label>
            <input v-model="form.phone" class="input-field" />
          </div>
        </div>
        <div class="grid-2-cols">
          <div class="form-group">
            <label class="label-bold">{{ t('worker.age') }}</label>
            <input v-model.number="form.age" type="number" class="input-field" min="18" max="70" />
          </div>
          <div class="form-group">
            <label class="label-bold">{{ t('worker.experienceYears') }}</label>
            <input v-model.number="form.experienceYears" type="number" class="input-field" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label class="label-bold">{{ t('worker.hourlyRate') }}</label>
          <input v-model.number="form.hourlyRate" type="number" class="input-field input-small" min="10" step="5" />
        </div>
        <div class="grid-2-cols">
          <div class="form-group">
            <label class="label-bold">{{ t('worker.serviceTypes') }}</label>
            <div class="checkbox-list">
              <label v-for="svc in serviceOptions" :key="svc.value" class="checkbox-item">
                <input type="checkbox" :value="svc.value" v-model="form.serviceTypes" class="checkbox-input" />
                <span class="svc-label">{{ svc.label }}</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="label-bold">{{ t('worker.zonesLabel') }}</label>
             <div class="checkbox-list zones-scroll border-box">
              <label v-for="z in zoneOptions" :key="z.value" class="checkbox-item">
                <input type="checkbox" :value="z.value" v-model="form.zones" class="checkbox-input" />
                 <span class="svc-label">{{ z.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="label-bold">{{ t('worker.bio') }}</label>
           <textarea v-model="form.bio" class="input-field no-resize" rows="4"></textarea>
        </div>

        <div v-if="success" class="alert success-box"><AppIcon name="check" :size="15" /> Perfil actualizado</div>
        <div v-if="error" class="alert error-box"><AppIcon name="alertTriangle" :size="15" /> {{ error }}</div>

        <button @click="save" class="btn btn-primary btn-full submit-btn" :disabled="saving">
          <div v-if="saving" class="spinner spinner-sm"></div>
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { WorkerProfileService } from "../../application/worker-profile.service.js";
import { buildServiceOptions } from "../../../Shared/domain/constants/services.js";
import { buildZoneOptions } from "../../../Shared/domain/constants/zones.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const auth = useAuthStore();
const loading = ref(true);
const saving = ref(false);
const success = ref(false);
const error = ref("");

const form = ref({ name:"", phone:"", age:25, experienceYears:1, hourlyRate:25, serviceTypes:[], zones:[], bio:"" });
const initials = computed(() => (auth.user?.name || "W").split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase());

const serviceOptions = computed(() => buildServiceOptions(t));
const zoneOptions = computed(() => buildZoneOptions(t));

async function save() {
  saving.value = true;
  error.value = "";
  try {
    await WorkerProfileService.updateProfile(form.value);
    success.value = true;
    setTimeout(() => success.value = false, 3000);
  } catch (e) {
    error.value = e.response?.data?.error || t("common.error");
  } finally { saving.value = false; }
}

onMounted(async () => {
  try {
    const profile = await WorkerProfileService.getProfile();
    form.value = { name:profile.name, phone:profile.phone, age:profile.age,
      experienceYears:profile.experienceYears, hourlyRate:profile.hourlyRate,
      serviceTypes:profile.serviceTypes, zones:profile.zones, bio:profile.bio };
  } catch {} finally { loading.value = false; }
});
</script>

<style scoped>
.view-container {
  max-width: 1024px;
  margin: 1rem auto 0;
}
@media (min-width: 640px) {
  .view-container { margin-top: 2rem; }
}

.view-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 800;
}

.loader-wrapper {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.profile-card {
  max-width: 896px;
  margin: 0 auto;
  padding: 2rem;
}
@media (min-width: 640px) {
  .profile-card { padding: 3rem; }
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-avatar { 
  width: 80px; 
  height: 80px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  margin: 0 auto 1rem;
}
.avatar-purple { background: #1A2E4A; }
.avatar-initial { color: white; font-size: 1.75rem; font-weight: 700; }

.profile-name { font-size: 1.5rem; font-weight: 700; color: #1A2E4A; margin-bottom: 0.25rem; }

.form-group-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.grid-2-cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .grid-2-cols { grid-template-columns: repeat(2, 1fr); }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label-bold {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #3A4A5C;
  margin-bottom: 0.25rem;
}

.input-small {
  max-width: 320px;
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.border-box {
  border: 1px solid #c5e8d8;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
}
.checkbox-item:hover { background-color: #E6F9F2; }

.checkbox-input {
  width: 1rem;
  height: 1rem;
  accent-color: #1A2E4A;
}

.svc-label { font-size: 0.9375rem; }
.zones-scroll { max-height: 120px; overflow-y: auto; }
.no-resize { resize: none; }

.alert {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
.success-box { background: #E6F9F2; color: #009960; }
.error-box { background: #fee2e2; color: #991b1b; }

.submit-btn {
  padding: 0.75rem 0;
  font-size: 1.125rem;
  margin-top: 1rem;
}

.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:28px; height:28px; animation: spin 1s linear infinite; }
.spinner-lg { width:36px; height:36px; }
.spinner-sm { width:18px; height:18px; border-width:2px; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
