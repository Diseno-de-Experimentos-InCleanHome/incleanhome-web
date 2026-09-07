<template>
  <div class="accept-view">
    <div class="accept-container card card-elevated">
      <h1 class="page-title">{{ t('auth.acceptTermsTitle') }}</h1>
      <p class="subtitle">{{ t('auth.acceptTermsSubtitle') }}</p>

      <div v-if="loadingDoc" class="loader-wrapper"><div class="spinner"></div></div>
      <div v-else class="legal-content" v-html="html"></div>

      <div v-if="error" class="error-box">{{ error }}</div>

      <div class="actions">
        <button @click="handleCancel" class="btn btn-secondary flex-1">{{ t('common.cancel') }}</button>
        <button @click="handleAccept" class="btn btn-primary flex-1" :disabled="submitting || loadingDoc">
          <div v-if="submitting" class="spinner spinner-sm"></div>
          {{ submitting ? t('common.loading') : t('auth.acceptAndContinue') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { marked } from "marked";
import { useAuthStore } from "../../application/auth.store.js";
import { AuthenticationService } from "../../application/authentication.service.js";
import { CURRENT_TERMS_VERSION } from "../../../Shared/domain/constants/terms.js";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const html = ref("");
const loadingDoc = ref(true);
const submitting = ref(false);
const error = ref("");

onMounted(async () => {
  if (!auth.challengeToken) {
    router.replace("/login");
    return;
  }
  const res = await fetch(`/docs/terms-${CURRENT_TERMS_VERSION}.md`);
  const markdown = await res.text();
  html.value = marked.parse(markdown);
  loadingDoc.value = false;
});

function handleCancel() {
  auth.clearChallengeToken();
  router.push("/login");
}

async function handleAccept() {
  submitting.value = true;
  error.value = "";
  try {
    const result = await AuthenticationService.acceptTerms(CURRENT_TERMS_VERSION);
    if (result.requires2fa) {
      router.push("/2fa-verify");
    } else if (result.requires2faSetup) {
      router.push("/2fa-setup");
    } else {
      router.push(result.user.role === "worker" ? "/worker/dashboard" : "/client/search");
    }
  } catch (e) {
    error.value = e.response?.data?.error || t('common.error');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.accept-view { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.accept-container { width: 100%; max-width: 640px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
.page-title { font-size: 1.5rem; font-weight: 800; color: #1A2E4A; margin-bottom: 0.25rem; }
.subtitle { color: #3A4A5C; font-size: 0.9375rem; margin-bottom: 1.5rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 3rem 0; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; }
.spinner-sm { width: 18px; height: 18px; border-width: 2px; display: inline-block; margin-right: 0.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }
.legal-content { max-height: 320px; overflow-y: auto; border: 1px solid #c5e8d8; border-radius: 0.75rem; padding: 1.25rem; background: #FAFDFB; }
.legal-content :deep(h1) { font-size: 1.25rem; font-weight: 800; color: #1A2E4A; margin-bottom: 1rem; }
.legal-content :deep(h2) { font-size: 1rem; font-weight: 700; color: #1A2E4A; margin-top: 1.25rem; margin-bottom: 0.5rem; }
.legal-content :deep(p) { color: #3A4A5C; line-height: 1.6; margin-bottom: 0.75rem; font-size: 0.9375rem; }
.legal-content :deep(ul) { color: #3A4A5C; line-height: 1.6; margin-bottom: 0.75rem; padding-left: 1.25rem; font-size: 0.9375rem; }
.legal-content :deep(strong) { color: #1A2E4A; }
.error-box { background:#fee2e2; color:#991b1b; padding:0.75rem; border-radius:0.5rem; font-size:0.875rem; margin-top: 1rem; }
.actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.flex-1 { flex: 1; display: flex; align-items: center; justify-content: center; }
</style>
