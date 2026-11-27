<template>
  <section class="card summary">
    <h2 class="summary-title">{{ t('claims.summary.title') }}</h2>
    <p class="summary-hint">{{ t('claims.summary.hint') }}</p>

    <form class="summary-form" novalidate @submit.prevent="load">
      <label class="summary-field">
        <span class="label">{{ t('claims.summary.from') }}</span>
        <input v-model="from" type="date" class="input-field" data-test="summary-from" />
      </label>
      <label class="summary-field">
        <span class="label">{{ t('claims.summary.to') }}</span>
        <input v-model="to" type="date" class="input-field" data-test="summary-to" />
      </label>
      <button type="submit" class="btn btn-primary btn-sm">{{ t('claims.summary.apply') }}</button>
    </form>

    <p v-if="error" class="summary-error" role="alert">{{ error }}</p>

    <dl v-else-if="summary" class="summary-grid" aria-live="polite">
      <div class="stat" data-test="summary-total">
        <dt>{{ t('claims.summary.total') }}</dt>
        <dd>{{ summary.total }}</dd>
      </div>
      <div v-for="status in CLAIM_STATUSES" :key="status" class="stat" :data-test="`summary-${status}`">
        <dt>{{ t(`claims.status.${status}`) }}</dt>
        <dd>{{ summary.byStatus?.[status] ?? 0 }}</dd>
      </div>
      <div class="stat stat-wide" data-test="summary-average">
        <dt>{{ t('claims.summary.average') }} ({{ t('claims.summary.closed') }}: {{ summary.closedClaims }})</dt>
        <dd>{{ formatDuration(summary.averageResolutionSeconds) ?? t('claims.summary.noClosed') }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
/**
 * Resumen de reclamos por periodo: cantidad por estado y promedio de resolución (US36).
 * Capa: Claims / presentation / components
 */
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ClaimsApi } from "../../infrastructure/claims.api.js";
import { CLAIM_STATUSES } from "../../domain/model/claim-status.value.js";
import { formatDuration } from "../../domain/services/claim-times.js";

const { t } = useI18n();
const from = ref("");
const to = ref("");
const summary = ref(null);
const error = ref("");
let latest = 0;

async function load() {
  const query = ++latest;
  error.value = "";
  if (from.value && to.value && from.value > to.value) {
    error.value = t("claims.summary.invalidRange");
    return;
  }
  try {
    const data = await ClaimsApi.summary({ from: from.value, to: to.value });
    if (query === latest) summary.value = data;
  } catch (e) {
    if (query === latest) error.value = e.response?.data?.error || t("claims.summary.loadError");
  }
}

defineExpose({ reload: load });
onMounted(load);
</script>

<style scoped>
.summary { margin-bottom: 1.5rem; }
.summary-title { font-size: 1.125rem; font-weight: 700; color: #1A2E4A; }
.summary-hint { font-size: 0.8125rem; color: #3A4A5C; margin-bottom: 0.875rem; }
.summary-form { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; }
.summary-field { flex: 1; min-width: 150px; }
.summary-error { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; margin-top: 1rem; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
.stat { background: #E6F9F2; border-radius: 0.5rem; padding: 0.75rem; }
.stat dt { font-size: 0.75rem; color: #3A4A5C; }
.stat dd { font-size: 1.375rem; font-weight: 800; color: #1A2E4A; margin: 0; }
.stat-wide { grid-column: 1 / -1; }
</style>
