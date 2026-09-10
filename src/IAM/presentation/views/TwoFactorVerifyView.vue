<template>
  <div class="verify-view">
    <div class="verify-container card card-elevated">
      <h1 class="page-title">{{ t('auth.twoFactorVerifyTitle') }}</h1>
      <p class="subtitle">{{ t('auth.twoFactorVerifySubtitle') }}</p>

      <div class="form-group">
        <label class="label">{{ t('auth.twoFactorCodeLabel') }}</label>
        <input
          v-model="code"
          type="text"
          maxlength="6"
          inputmode="numeric"
          autocomplete="one-time-code"
          class="input-field code-input"
          placeholder="000000"
          @keyup.enter="handleVerify"
        />
      </div>

      <div v-if="error" class="error-box">{{ error }}</div>

      <button @click="handleVerify" class="btn btn-primary btn-full btn-lg submit-btn" :disabled="submitting || code.length !== 6">
        <div v-if="submitting" class="spinner spinner-sm"></div>
        {{ submitting ? t('common.loading') : t('auth.twoFactorConfirm') }}
      </button>

      <button @click="handleCancel" class="btn btn-secondary btn-full back-btn">{{ t('auth.backToLogin') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../application/auth.store.js";
import { AuthenticationService } from "../../application/authentication.service.js";
import { roleHomePath } from "../../../Shared/domain/constants/roles.js";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const code = ref("");
const submitting = ref(false);
const error = ref("");

onMounted(() => {
  if (!auth.challengeToken) {
    router.replace("/login");
  }
});

async function handleVerify() {
  submitting.value = true;
  error.value = "";
  try {
    const result = await AuthenticationService.verifyTwoFactor(code.value);
    if (result.membershipPending) {
      router.push("/membership-pending");
      return;
    }
    router.push(roleHomePath(result.user.role));
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error');
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  auth.clearChallengeToken();
  router.push("/login");
}
</script>

<style scoped>
.verify-view { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.verify-container { width: 100%; max-width: 400px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.08); text-align: center; }
.page-title { font-size: 1.5rem; font-weight: 800; color: #1A2E4A; margin-bottom: 0.25rem; }
.subtitle { color: #3A4A5C; font-size: 0.9375rem; margin-bottom: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; text-align: left; }
.label { font-size: 0.875rem; font-weight: 600; color: #3A4A5C; }
.code-input { text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; font-weight: 700; }
.error-box { background:#fee2e2; color:#991b1b; padding:0.75rem; border-radius:0.5rem; font-size:0.875rem; margin-bottom: 1rem; }
.submit-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; }
.spinner-sm { width: 18px; height: 18px; border-width: 2px; display: inline-block; margin-right: 0.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }
.back-btn { margin-top: 0.75rem; }
</style>
