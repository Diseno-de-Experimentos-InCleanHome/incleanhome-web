<template>
  <div class="view-container">
    <h1 class="page-title">{{ t('security.title') }}</h1>
    <p class="intro">{{ t('security.intro') }}</p>

    <div v-if="reported" class="alert success-box" role="status" data-test="report-done">
      <span>{{ t('security.reportDone') }}</span>
    </div>
    <div v-if="reportError" class="alert error-box" role="alert">{{ reportError }}</div>

    <div class="card account-card">
      <div v-if="activity" class="two-factor" data-test="two-factor">
        <span>{{ t('security.twoFactor') }}</span>
        <span :class="['badge', activity.twoFactorEnabled ? 'badge-green' : 'badge-red']">
          {{ activity.twoFactorEnabled ? t('security.enabled') : t('security.disabled') }}
        </span>
      </div>
      <router-link :to="`${roleAccountPath(auth.user?.role)}/password`" class="btn btn-secondary btn-sm">
        {{ t('security.changePassword') }}
      </router-link>
    </div>

    <h2 class="section-title">{{ t('security.recent') }}</h2>

    <div v-if="loading" class="intro" role="status">{{ t('common.loading') }}</div>
    <div v-else-if="failed" class="alert error-box" role="alert">
      <span>{{ t('security.loadError') }}</span>
      <button type="button" class="btn btn-secondary btn-sm" data-test="activity-retry" @click="load">
        {{ t('security.retry') }}
      </button>
    </div>
    <p v-else-if="!activity.accesses.length" class="intro" data-test="activity-empty">{{ t('security.empty') }}</p>
    <ul v-else class="access-list">
      <li v-for="access in activity.accesses" :key="access.id" class="card access" data-test="access">
        <div class="access-info">
          <span class="access-date">{{ formatDate(access.occurredAt) }}</span>
          <span class="access-meta">
            <span class="badge badge-gray">{{ platformLabel(access.platform) }}</span>
            <span :class="['badge', access.result === 'success' ? 'badge-green' : 'badge-red']">
              {{ access.result === 'success' ? t('security.success') : t('security.failed') }}
            </span>
            <span>{{ access.twoFactorVerified ? t('security.verified') : t('security.notVerified') }}</span>
          </span>
        </div>
        <span v-if="reportedIds.has(access.id)" class="reported">{{ t('security.reported') }}</span>
        <button v-else type="button" class="btn btn-outline btn-sm" data-test="report"
          :aria-label="t('security.reportNamed', { date: formatDate(access.occurredAt) })"
          @click="pending = access">
          {{ t('security.report') }}
        </button>
      </li>
    </ul>

    <div v-if="pending" class="modal-overlay" @click.self="cancel">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <h3 id="report-title" class="card-title">{{ t('security.confirmTitle') }}</h3>
        <p class="intro">{{ formatDate(pending.occurredAt) }} · {{ platformLabel(pending.platform) }}</p>
        <p class="intro">{{ t('security.confirmText') }}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" :disabled="reporting" @click="cancel">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-danger" data-test="confirm-report" :disabled="reporting" @click="report">
            {{ reporting ? t('common.loading') : t('security.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/** US40 — últimos accesos de la cuenta y reporte de uno que no se reconoce. */
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../application/auth.store.js";
import { AccountSecurityService } from "../../application/account-security.service.js";
import { roleAccountPath } from "../../../Shared/domain/constants/roles.js";

const { t, locale } = useI18n();
const auth = useAuthStore();

const activity = ref(null);
const loading = ref(true);
const failed = ref(false);
const pending = ref(null); // acceso que se está por reportar
const reporting = ref(false);
const reported = ref(false);
const reportError = ref("");
// El API no devuelve qué accesos se reportaron: se marcan los de esta visita.
const reportedIds = ref(new Set());

const PLATFORMS = ["web", "mobile", "api"];
const platformLabel = (platform) =>
  t(`security.platforms.${PLATFORMS.includes(platform) ? platform : "unknown"}`);

function formatDate(value) {
  return new Date(value).toLocaleString(locale.value === "es" ? "es-PE" : "en-US",
    { dateStyle: "medium", timeStyle: "short" });
}

async function load() {
  loading.value = true;
  failed.value = false;
  try {
    activity.value = await AccountSecurityService.getAccessActivity();
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

function cancel() {
  if (!reporting.value) pending.value = null;
}

async function report() {
  const access = pending.value;
  reporting.value = true;
  reportError.value = "";
  try {
    await AccountSecurityService.reportAccess(access.id);
    reportedIds.value.add(access.id);
    reported.value = true;
    pending.value = null;
    await load();
  } catch (error) {
    pending.value = null;
    reportError.value = error.response?.status === 404 ? t("security.notFound") : t("common.error");
  } finally {
    reporting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.view-container { max-width: 768px; margin: 0 auto; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; margin-bottom: 0.5rem; }
.section-title { font-size: 1.125rem; font-weight: 700; color: #1A2E4A; margin: 1.5rem 0 0.75rem; }
.intro { color: #3A4A5C; font-size: 0.9375rem; margin: 0 0 1rem; }
.account-card { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
.two-factor { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #1A2E4A; }
.access-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.access { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding: 1rem; }
.access-info { display: flex; flex-direction: column; gap: 0.375rem; }
.access-date { font-weight: 700; color: #1A2E4A; }
.access-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #3A4A5C; }
.reported { font-size: 0.875rem; font-weight: 600; color: #991b1b; }
.alert { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; margin-bottom: 1rem; }
.success-box { background: white; border: 1px solid #009960; color: #00704a; }
.error-box { background: #fee2e2; color: #991b1b; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-box { background: white; border-radius: 1rem; padding: 1.5rem; width: 100%; max-width: 420px; }
.card-title { font-weight: 700; font-size: 1.25rem; margin-bottom: 0.75rem; }
.modal-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 0.75rem; }
</style>
