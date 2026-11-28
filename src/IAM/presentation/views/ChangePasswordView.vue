<template>
  <div :class="['password-view', { standalone }]">
    <div class="card password-card">
      <h1 class="page-title">{{ t('security.changePassword') }}</h1>
      <p v-if="required" class="notice" data-test="password-required">{{ t('security.changeRequired') }}</p>
      <p class="intro">{{ standalone ? t('security.passwordIntroSignIn') : t('security.passwordIntro') }}</p>

      <div v-if="done" class="alert success-box" role="status" data-test="password-done">
        {{ t('security.passwordDone') }}
      </div>

      <form class="password-form" novalidate @submit.prevent="submit">
        <div v-for="field in FIELDS" :key="field.name" class="form-group">
          <label class="label-bold" :for="`password-${field.name}`">{{ t(field.label) }}</label>
          <input :id="`password-${field.name}`" v-model="form[field.name]" type="password"
            :autocomplete="field.autocomplete" maxlength="100"
            :class="['input-field', { 'input-error': errors[field.name] }]" @blur="touch(field.name)" />
          <p v-if="errors[field.name]" class="field-error" role="alert">{{ errors[field.name] }}</p>
        </div>
        <p class="hint">{{ t('security.rules', { min: PASSWORD_MIN_LENGTH }) }}</p>

        <div v-if="error" class="alert error-box" role="alert">{{ error }}</div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="submitting">
          {{ submitting ? t('common.loading') : t('security.savePassword') }}
        </button>
        <router-link v-if="standalone" to="/login" class="btn btn-secondary btn-full">
          {{ t('auth.backToLogin') }}
        </router-link>
        <router-link v-else :to="`${roleAccountPath(auth.user?.role)}`" class="btn btn-secondary btn-full">
          {{ t('security.title') }}
        </router-link>
      </form>
    </div>
  </div>
</template>

<script setup>
/**
 * US40 — cambio de contraseña. Con sesión es una pantalla de la cuenta; sin ella usa el
 * token que entrega el inicio de sesión cuando el cambio es obligatorio.
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../application/auth.store.js";
import { AccountSecurityService } from "../../application/account-security.service.js";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH, passwordProblems } from "../../domain/services/password-policy.js";
import { isRateLimited } from "../../domain/services/rate-limit.js";
import { useAuthErrorMessage } from "../composables/useAuthErrorMessage.js";
import { useFormValidation } from "../../../Shared/presentation/composables/useFormValidation.js";
import { roleAccountPath } from "../../../Shared/domain/constants/roles.js";

const FIELDS = [
  { name: "currentPassword", label: "security.currentPassword", autocomplete: "current-password" },
  { name: "newPassword", label: "security.newPassword", autocomplete: "new-password" },
  { name: "confirmation", label: "security.confirmation", autocomplete: "new-password" },
];
const emptyForm = () => ({ currentPassword: "", newPassword: "", confirmation: "" });

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const errorMessage = useAuthErrorMessage();

// Se fija al abrir: tras el cambio la pantalla no cambia de modo mientras se redirige.
const standalone = !auth.isLoggedIn;
const required = computed(() => standalone || auth.passwordChangeRequired);

const form = ref(emptyForm());
const submitting = ref(false);
const done = ref(false);
const error = ref("");

const mandatory = (value) => (value ? null : t("validation.required"));
const schema = computed(() => ({
  currentPassword: [mandatory],
  newPassword: [
    mandatory,
    (value) => {
      const [problem] = passwordProblems(value, auth.user?.email);
      return problem
        ? t(`security.problems.${problem}`, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_BYTES })
        : null;
    },
    (value, data) => (value === data.currentPassword ? t("security.sameAsCurrent") : null),
  ],
  confirmation: [mandatory, (value, data) => (value === data.newPassword ? null : t("security.mismatch"))],
}));
const { errors, touch, validateAll, resetErrors } = useFormValidation(form, schema);

function backToLogin(notice) {
  auth.clearChallengeToken();
  if (notice) auth.setNotice(notice);
  router.replace("/login");
}

async function submit() {
  done.value = false;
  error.value = "";
  if (submitting.value || !validateAll()) return;
  submitting.value = true;
  const { currentPassword, newPassword } = form.value;
  try {
    await AccountSecurityService.changePassword({ currentPassword, newPassword });
    form.value = emptyForm();
    resetErrors();
    if (standalone) router.replace("/login");
    else done.value = true;
  } catch (e) {
    if (e.response?.status === 401) {
      // Con sesión, el 401 lo atiende el cierre de sesión general.
      if (standalone) backToLogin("password_expired");
    } else {
      error.value = isRateLimited(e) ? errorMessage(e) : e.response?.data?.error || t("common.error");
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  if (standalone && !auth.challengeToken) backToLogin();
});
</script>

<style scoped>
.password-view { max-width: 480px; margin: 0 auto; }
.password-view.standalone { max-width: none; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.password-card { width: 100%; max-width: 480px; padding: 2rem; }
.page-title { font-size: 1.5rem; font-weight: 800; color: #1A2E4A; margin-bottom: 0.75rem; }
.notice { background: #FFF7E6; color: #7A5C10; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; margin: 0 0 0.75rem; }
.intro { color: #3A4A5C; font-size: 0.9375rem; margin: 0 0 1rem; }
.password-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.label-bold { font-size: 0.875rem; font-weight: 600; color: #3A4A5C; }
.hint { font-size: 0.75rem; color: #3A4A5C; margin: 0; }
.alert { padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }
.success-box { background: #E6F9F2; border: 1px solid #009960; color: #00704a; margin-bottom: 1rem; }
.error-box { background: #fee2e2; color: #991b1b; }
</style>
