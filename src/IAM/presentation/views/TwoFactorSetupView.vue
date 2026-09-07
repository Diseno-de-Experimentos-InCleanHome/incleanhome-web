<template>
  <div class="setup-view">
    <div class="setup-container card card-elevated">
      <h1 class="page-title">{{ t('auth.twoFactorSetupTitle') }}</h1>
      <p class="subtitle">{{ t('auth.twoFactorSetupSubtitle') }}</p>

      <div v-if="loadingSetup" class="loader-wrapper"><div class="spinner"></div></div>

      <template v-else>
        <div class="qr-wrapper">
          <img :src="qrCodeDataUrl" alt="QR code" class="qr-image" />
        </div>

        <div class="secret-box">
          <span class="secret-label">{{ t('auth.twoFactorSecretLabel') }}</span>
          <code class="secret-value">{{ secret }}</code>
        </div>

        <p class="hint-text">{{ t('auth.twoFactorSetupHint') }}</p>

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
          />
        </div>

        <div v-if="error" class="error-box">{{ error }}</div>

        <button @click="handleEnable" class="btn btn-primary btn-full btn-lg submit-btn" :disabled="submitting || code.length !== 6">
          <div v-if="submitting" class="spinner spinner-sm"></div>
          {{ submitting ? t('common.loading') : t('auth.twoFactorConfirm') }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../application/auth.store.js";
import { AuthenticationService } from "../../application/authentication.service.js";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const qrCodeDataUrl = ref("");
const secret = ref("");
const code = ref("");
const loadingSetup = ref(true);
const submitting = ref(false);
const error = ref("");

onMounted(async () => {
  if (!auth.challengeToken) {
    router.replace("/login");
    return;
  }
  try {
    const data = await AuthenticationService.setupTwoFactor();
    qrCodeDataUrl.value = data.qrCodeDataUrl;
    secret.value = data.secret;
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error');
  } finally {
    loadingSetup.value = false;
  }
});

async function handleEnable() {
  submitting.value = true;
  error.value = "";
  try {
    const user = await AuthenticationService.enableTwoFactor(code.value);
    router.push(user.role === "worker" ? "/worker/dashboard" : "/client/search");
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.setup-view { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.setup-container { width: 100%; max-width: 420px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.08); text-align: center; }
.page-title { font-size: 1.5rem; font-weight: 800; color: #1A2E4A; margin-bottom: 0.25rem; }
.subtitle { color: #3A4A5C; font-size: 0.9375rem; margin-bottom: 1.5rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 3rem 0; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; }
.spinner-sm { width: 18px; height: 18px; border-width: 2px; display: inline-block; margin-right: 0.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }
.qr-wrapper { display: flex; justify-content: center; margin-bottom: 1.25rem; }
.qr-image { width: 200px; height: 200px; border: 1px solid #c5e8d8; border-radius: 0.75rem; padding: 0.5rem; background: white; }
.secret-box { background: #E6F9F2; border-radius: 0.75rem; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
.secret-label { font-size: 0.75rem; font-weight: 600; color: #3A4A5C; text-transform: uppercase; letter-spacing: 0.03em; }
.secret-value { font-family: monospace; font-size: 0.9375rem; color: #1A2E4A; word-break: break-all; }
.hint-text { font-size: 0.8125rem; color: #7A8FA6; line-height: 1.5; margin-bottom: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; text-align: left; }
.label { font-size: 0.875rem; font-weight: 600; color: #3A4A5C; }
.code-input { text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; font-weight: 700; }
.error-box { background:#fee2e2; color:#991b1b; padding:0.75rem; border-radius:0.5rem; font-size:0.875rem; margin-bottom: 1rem; }
.submit-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
</style>
