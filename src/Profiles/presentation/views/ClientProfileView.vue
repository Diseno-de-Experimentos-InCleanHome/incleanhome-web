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
        <div class="profile-avatar avatar-blue">
          <span class="avatar-initial">{{ initials }}</span>
        </div>
        <h2 class="profile-name">{{ form.name }}</h2>
        <span class="badge badge-blue">{{ t('auth.client') }}</span>
      </div>
      
      <div class="form-group-list">
        <div class="form-group">
          <label class="label-bold">{{ t('auth.name') }}</label>
          <input v-model="form.name" class="input-field" />
        </div>
        <div class="form-group">
          <label class="label-bold">{{ t('auth.email') }}</label>
          <input :value="auth.user?.email" class="input-field input-disabled" disabled />
        </div>
        <div class="form-group">
          <label class="label-bold">{{ t('auth.phone') }}</label>
          <input v-model="form.phone" class="input-field" />
        </div>
        
        <div v-if="error" class="alert error-box"><AppIcon name="alertTriangle" :size="15" /> {{ error }}</div>
        <div v-if="success" class="alert success-box"><AppIcon name="check" :size="15" /> {{ t('common.success') }}</div>
        
        <button @click="save" class="btn btn-primary btn-full submit-btn" :disabled="saving">
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
import { ClientProfileService } from "../../application/client-profile.service.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const auth = useAuthStore();
const saving = ref(false);
const success = ref(false);
const error = ref("");
const loading = ref(true);
const form = ref({ name: "", phone: "" });
const initials = computed(() => (form.value.name || "U").split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase());

onMounted(async () => {
  try {
    const profile = await ClientProfileService.getProfile();
    form.value = { name: profile.name, phone: profile.phone };
  } catch (err) {
    error.value = t('common.error');
  } finally {
    loading.value = false;
  }
});

async function save() {
  if (!form.value.name.trim()) {
    error.value = t('validation.nameRequired') || "El nombre es requerido";
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    const updated = await ClientProfileService.updateProfile(form.value);
    auth.updateUser({ name: updated.name, phone: updated.phone });
    success.value = true;
    setTimeout(() => success.value = false, 3000);
  } catch (err) {
    error.value = err.response?.data?.message || t('common.error');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.view-container {
  max-width: 896px;
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
  padding: 3rem 0;
}

.profile-card {
  max-width: 672px;
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
.avatar-blue { background: #009960; }
.avatar-initial { color: white; font-size: 1.75rem; font-weight: 700; }

.profile-name { font-size: 1.5rem; font-weight: 700; color: #1A2E4A; margin-bottom: 0.25rem; }

.form-group-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
}

.input-disabled { background: #E6F9F2; cursor: not-allowed; }

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

@media (max-width: 640px) {
  .profile-avatar { width: 70px; height: 70px; }
  .avatar-initial { font-size: 1.5rem; }
  .profile-name { font-size: 1.25rem; }
}
</style>
