<template>
  <div class="auth-wrapper auth-bg">
    <div class="auth-container">
      <div class="auth-header">
        <router-link to="/login" class="logo-wrapper-link">
          <div class="logo-small">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span class="brand">InClean<span class="brand-accent">Home</span></span>
        </router-link>
      </div>

      <Transition name="fade" mode="out-in">
        <div v-if="step === 1" class="card card-elevated">
          <h2 class="card-title small">{{ t('auth.registerTitle') }}</h2>
          <p class="card-subtitle">{{ t('auth.selectRole') }}</p>
          <div class="role-grid">
            <button @click="selectRole('client')" :class="['role-card', selectedRole === 'client' ? 'role-selected' : '']">
              <div class="role-emoji"><AppIcon name="house" :size="28" /></div>
              <div class="role-title">{{ t('auth.client') }}</div>
              <div class="role-desc">{{ t('auth.clientDesc') }}</div>
            </button>
            <button @click="selectRole('worker')" :class="['role-card', selectedRole === 'worker' ? 'role-selected-w' : '']">
              <div class="role-emoji"><AppIcon name="person" :size="28" /></div>
              <div class="role-title">{{ t('auth.worker') }}</div>
              <div class="role-desc">{{ t('auth.workerDesc') }}</div>
            </button>
          </div>
          <button @click="step = 2" class="btn btn-primary btn-full btn-lg btn-continue" :disabled="!selectedRole">Continuar →</button>
          <div class="card-footer">
            {{ t('auth.alreadyAccount') }}
            <router-link to="/login" class="link-primary"> {{ t('auth.login') }}</router-link>
          </div>
        </div>

        <div v-else-if="step === 2" class="card card-elevated">
          <button @click="step = 1" class="back-btn">← {{ t('common.back') }}</button>
          <h2 class="card-title">{{ selectedRole === 'client' ? t('auth.client') : t('auth.worker') }} — {{ t('auth.registerTitle') }}</h2>
          <form @submit.prevent="handleRegister" class="auth-form" novalidate>
            <div class="form-grid">
              <div class="form-group">
                <label class="label">{{ t('auth.name') }}</label>
                <input v-model="form.name" type="text" :class="['input-field', { 'input-error': errors.name }]" required :maxlength="LIMITS.nameMax" @blur="touch('name')" />
                <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
              </div>
              <div class="form-group">
                <label class="label">{{ t('auth.phone') }}</label>
                <input v-model="form.phone" type="tel" :class="['input-field', { 'input-error': errors.phone }]" placeholder="999999999" inputmode="numeric" maxlength="12" @keypress="blockNonDigits" @blur="touch('phone')" />
                <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
              </div>
            </div>
            <div class="form-group">
              <label class="label">{{ t('auth.email') }}</label>
              <input v-model="form.email" type="email" :class="['input-field', { 'input-error': errors.email }]" required :maxlength="LIMITS.emailMax" @blur="touch('email')" />
              <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
            </div>
            <div class="form-group">
              <label class="label">{{ t('auth.password') }} <span class="hint-text">({{ t('auth.minPassword') }})</span></label>
              <input v-model="form.password" type="password" :class="['input-field', { 'input-error': errors.password }]" required minlength="8" @blur="touch('password')" />
              <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
            </div>
            <template v-if="selectedRole === 'worker'">
              <div class="form-grid">
                <div class="form-group">
                  <label class="label">{{ t('worker.age') }}</label>
                  <input v-model.number="form.age" type="number" :class="['input-field', { 'input-error': errors.age }]" required :min="LIMITS.ageMin" :max="LIMITS.ageMax" @blur="touch('age')" />
                  <p v-if="errors.age" class="field-error">{{ errors.age }}</p>
                </div>
                <div class="form-group">
                  <label class="label">{{ t('worker.gender') }}</label>
                  <select v-model="form.gender" :class="['input-field', { 'input-error': errors.gender }]" required @change="touch('gender')">
                    <option value="female">{{ t('worker.female') }}</option>
                    <option value="male">{{ t('worker.male') }}</option>
                    <option value="other">{{ t('worker.other') }}</option>
                  </select>
                  <p v-if="errors.gender" class="field-error">{{ errors.gender }}</p>
                </div>
              </div>
              <div class="form-group">
                <label class="label">{{ t('worker.serviceTypes') }}</label>
                <div class="checkbox-group mt-1">
                  <label v-for="svc in serviceOptions" :key="svc.value" class="checkbox-label">
                    <input type="checkbox" :value="svc.value" v-model="form.serviceTypes" @change="touch('serviceTypes')" />
                    <span class="svc-label">{{ svc.label }}</span>
                  </label>
                </div>
                <p v-if="errors.serviceTypes" class="field-error">{{ errors.serviceTypes }}</p>
              </div>
              <div class="form-group">
                <label class="label">{{ t('worker.zonesLabel') }}</label>
                <div class="checkbox-group mt-1 zones-scroll">
                  <label v-for="z in zoneOptions" :key="z.value" class="checkbox-label">
                    <input type="checkbox" :value="z.value" v-model="form.zones" />
                    <span class="svc-label">{{ z.label }}</span>
                  </label>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="label">{{ t('worker.hourlyRate') }}</label>
                  <input v-model.number="form.hourlyRate" type="number" :class="['input-field', { 'input-error': errors.hourlyRate }]" required :min="LIMITS.hourlyRateMin" step="5" @blur="touch('hourlyRate')" />
                  <p v-if="errors.hourlyRate" class="field-error">{{ errors.hourlyRate }}</p>
                </div>
                <div class="form-group">
                  <label class="label">{{ t('worker.experienceYears') }}</label>
                  <input v-model.number="form.experienceYears" type="number" :class="['input-field', { 'input-error': errors.experienceYears }]" :min="LIMITS.experienceMin" :max="LIMITS.experienceMax" @blur="touch('experienceYears')" />
                  <p v-if="errors.experienceYears" class="field-error">{{ errors.experienceYears }}</p>
                </div>
              </div>
              <div class="form-group">
                <label class="label">{{ t('worker.bio') }}</label>
                <textarea v-model="form.bio" :class="['input-field', 'no-resize', { 'input-error': errors.bio }]" rows="2" :maxlength="LIMITS.bioMax" @blur="touch('bio')"></textarea>
                <p v-if="errors.bio" class="field-error">{{ errors.bio }}</p>
              </div>
            </template>
            <label class="checkbox-label terms-checkbox">
              <input type="checkbox" v-model="acceptedTerms" />
              <span class="svc-label" v-html="termsCheckboxLabel"></span>
            </label>
            <div v-if="error" class="error-box">{{ error }}</div>
            <button type="submit" class="btn btn-primary btn-full btn-lg submit-btn" :disabled="loading || !acceptedTerms">
              <div v-if="loading" class="spinner spinner-sm"></div>
              {{ loading ? t('common.loading') : t('auth.register') }}
            </button>
          </form>
        </div>
      </Transition>

      <div class="lang-toggle-container mt-4">
        <button @click="toggleLang" class="lang-btn">{{ locale === 'es' ? 'English' : 'Español' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { AuthenticationService } from "../../application/authentication.service.js";
import { buildServiceOptions } from "../../../Shared/domain/constants/services.js";
import { buildZoneOptions } from "../../../Shared/domain/constants/zones.js";
import { CURRENT_TERMS_VERSION } from "../../../Shared/domain/constants/terms.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";
import {
  LIMITS, required, minLength, maxLength, personName, email, peruPhone,
  strongPassword, integer, numeric, min, max, minItems, blockNonDigits,
} from "../../../Shared/domain/validation/validators.js";
import { useFormValidation } from "../../../Shared/presentation/composables/useFormValidation.js";

const { t, locale } = useI18n();
const router = useRouter();

const step = ref(1);
const selectedRole = ref("");
const loading = ref(false);
const error = ref("");
const acceptedTerms = ref(false);

const termsCheckboxLabel = computed(() => t('auth.acceptTermsCheckbox', {
  terms: `<a href="/terms" target="_blank" class="link-primary">${t('auth.terms')}</a>`,
  privacy: `<a href="/privacy" target="_blank" class="link-primary">${t('auth.privacy')}</a>`,
}));

const form = ref({
  name: "", email: "", password: "", phone: "",
  age: 25, gender: "female", serviceTypes: [], zones: [],
  hourlyRate: 25, experienceYears: 1, bio: "",
});

const schema = computed(() => {
  const req = required(t('validation.required'));
  const len = (n) => maxLength(n, t('validation.maxLength', { n }));
  const base = {
    name: [req, minLength(LIMITS.nameMin, t('validation.minLength', { n: LIMITS.nameMin })), len(LIMITS.nameMax), personName(t('validation.personName'))],
    phone: [peruPhone(t('validation.peruPhone'))],
    email: [req, email(t('validation.email')), len(LIMITS.emailMax)],
    password: [req, strongPassword(t('validation.strongPassword'))],
  };
  if (selectedRole.value !== "worker") return base;
  return {
    ...base,
    age: [req, integer(t('validation.integer')), min(LIMITS.ageMin, t('validation.min', { n: LIMITS.ageMin })), max(LIMITS.ageMax, t('validation.max', { n: LIMITS.ageMax }))],
    gender: [req],
    serviceTypes: [minItems(1, t('validation.serviceTypesRequired'))],
    hourlyRate: [req, numeric(t('validation.numeric')), min(LIMITS.hourlyRateMin, t('validation.min', { n: LIMITS.hourlyRateMin }))],
    experienceYears: [integer(t('validation.integer')), min(LIMITS.experienceMin, t('validation.min', { n: LIMITS.experienceMin })), max(LIMITS.experienceMax, t('validation.max', { n: LIMITS.experienceMax }))],
    bio: [len(LIMITS.bioMax)],
  };
});
const { errors, touch, validateAll, resetErrors } = useFormValidation(form, schema);

function toggleLang() { locale.value = locale.value === "es" ? "en" : "es"; }
function selectRole(role) {
  selectedRole.value = role;
  resetErrors();
}

const serviceOptions = computed(() => buildServiceOptions(t));
const zoneOptions = computed(() => buildZoneOptions(t));

async function handleRegister() {
  error.value = "";
  if (!validateAll()) return;
  if (!acceptedTerms.value) {
    error.value = t('auth.mustAcceptTerms');
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    if (selectedRole.value === "client") {
      const { name, email, password, phone } = form.value;
      await AuthenticationService.registerClient({ name, email, password, phone, acceptedTermsVersion: CURRENT_TERMS_VERSION });
    } else {
      await AuthenticationService.registerWorker({ ...form.value, acceptedTermsVersion: CURRENT_TERMS_VERSION });
    }
    // 2FA setup is mandatory right after registration, before the account can be used.
    router.push("/2fa-setup");
  } catch (e) {
    error.value = e.response?.data?.error || t("common.error");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; }
.auth-bg { background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.auth-container { width: 100%; max-width: 512px; }
.auth-header { text-align: center; margin-bottom: 1.5rem; }
.logo-wrapper-link { display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; text-decoration: none; }
.logo-small { width:40px; height:40px; background: linear-gradient(135deg,#009960,#00B272); border-radius:12px; display:flex; align-items:center; justify-content:center; }
.brand { font-size:1.5rem; font-weight:800; color:#1A2E4A; }
.brand-accent { color:#009960; }
.card-elevated { box-shadow:0 20px 40px rgba(0,0,0,0.08); padding: 2rem; }
.card-title { font-size:1.25rem; font-weight:700; color:#1A2E4A; margin-bottom:1.5rem; }
.card-title.small { margin-bottom:0.5rem; }
.card-subtitle { color:#3A4A5C; font-size:0.875rem; margin-bottom:1.5rem; }
.role-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.role-card { padding:1.5rem; border-radius:1rem; border:2px solid #c5e8d8; cursor:pointer; text-align:left; transition:all 0.15s; background:white; }
.role-card:hover { border-color: #7A8FA6; }
.role-emoji { color:#1A2E4A; margin-bottom:0.75rem; }
.role-title { font-weight:700; color:#1A2E4A; margin-bottom:0.375rem; }
.role-desc { font-size:0.8125rem; color:#3A4A5C; }
.role-selected { border-color:#009960; background:#E6F9F2; }
.role-selected-w { border-color:#1A2E4A; background:#E6F9F2; }
.btn-continue { margin-top:1.5rem; }
.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.checkbox-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.checkbox-label { display: flex; align-items: center; gap: 0.375rem; cursor: pointer; }
.terms-checkbox { align-items: flex-start; gap: 0.5rem; margin-top: 0.25rem; }
.terms-checkbox input { margin-top: 0.1875rem; }
.card-footer { text-align:center; margin-top:1rem; font-size:0.875rem; color:#3A4A5C; }
.link-primary { color:#009960; font-weight:500; text-decoration: none; }
.link-primary:hover { text-decoration: underline; }
.back-btn { background:none; border:none; cursor:pointer; color:#3A4A5C; font-size:0.875rem; display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem; padding: 0; }
.back-btn:hover { color: #1A2E4A; }
.hint-text { color:#7A8FA6; font-weight:400; }
.svc-label { font-size:0.8125rem; color:#3A4A5C; }
.zones-scroll { max-height:120px; overflow-y:auto; padding-right: 0.5rem; }
.no-resize { resize:none; }
.error-box { background:#fee2e2; color:#991b1b; padding:0.75rem; border-radius:0.5rem; font-size:0.875rem; }
.submit-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:28px; height:28px; animation: spin 1s linear infinite; }
.spinner-sm { width:18px; height:18px; border-width:2px; }
.lang-toggle-container { text-align: center; }
.lang-btn { font-size:0.8125rem; color:#3A4A5C; background:none; border:none; cursor:pointer; }
.lang-btn:hover { color: #1A2E4A; }
.mt-1 { margin-top: 0.25rem; }
.mt-4 { margin-top: 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .role-grid { grid-template-columns: 1fr; } .form-grid { grid-template-columns: 1fr; } }
</style>
