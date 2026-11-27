<template>
  <div class="timeline">
    <dl class="times">
      <div class="time">
        <dt>{{ t('claims.toFirstReview') }}</dt>
        <dd data-test="to-first-review">{{ firstReviewLabel }}</dd>
      </div>
      <div class="time">
        <dt>{{ t('claims.toClosure') }}</dt>
        <dd data-test="to-closure">{{ closureLabel }}</dd>
      </div>
    </dl>

    <button type="button" class="link-btn" :aria-expanded="open" data-test="toggle-history" @click="toggle">
      {{ open ? t('claims.hideHistory') : t('claims.showHistory') }}
    </button>

    <div v-if="open" data-test="history">
      <p v-if="failed" class="history-error" role="alert">{{ t('claims.historyError') }}</p>
      <div v-else-if="!history" class="spinner"></div>
      <p v-else-if="!history.length" class="history-empty">{{ t('claims.historyEmpty') }}</p>
      <ol v-else class="history">
        <li v-for="(change, index) in history" :key="index" class="history-item">
          <span class="history-change">{{ t('claims.change', { from: statusLabel(change.previousStatus), to: statusLabel(change.newStatus) }) }}</span>
          <span class="history-meta">{{ dateTime(change.changedAt) }} · {{ t('claims.changedBy', { admin: change.adminEmail || `#${change.adminId}` }) }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
/**
 * Tiempos de atención e historial de cambios de estado de un reclamo (US36, administrador).
 * Capa: Claims / presentation / components
 */
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ClaimsApi } from "../../infrastructure/claims.api.js";
import { ClaimStatus, isClosed } from "../../domain/model/claim-status.value.js";
import { formatDuration, secondsToFirstReview } from "../../domain/services/claim-times.js";
import { formatDateTime, parseApiDate } from "../../../Shared/domain/format/dates.js";

const props = defineProps({
  /** Recurso del reclamo tal como lo entrega GET /claims. */
  claim: { type: Object, required: true },
});

const { t, te, locale } = useI18n();
const open = ref(false);
const history = ref(null);
const failed = ref(false);

// El API informa los tiempos de los reclamos cerrados; en revisión salen del historial.
const firstReviewLabel = computed(() => {
  if (props.claim.status === ClaimStatus.REGISTERED) return t("claims.pending");
  const seconds = props.claim.secondsToFirstReview
    ?? (history.value ? secondsToFirstReview(props.claim.createdAt, history.value) : null);
  return formatDuration(seconds) ?? t("claims.notAvailable");
});

const closureLabel = computed(() => (isClosed(props.claim.status)
  ? formatDuration(props.claim.secondsToClosure) ?? t("claims.notAvailable")
  : t("claims.pending")));

const statusLabel = (status) => (te(`claims.status.${status}`) ? t(`claims.status.${status}`) : status);
const dateTime = (text) => formatDateTime(parseApiDate(text), locale.value);

async function load() {
  failed.value = false;
  try {
    history.value = await ClaimsApi.history(props.claim.id);
  } catch {
    failed.value = true;
  }
}

function toggle() {
  open.value = !open.value;
  if (open.value && !history.value) load();
}

// Se pide al abrirlo o si hace falta para la primera revisión; al actualizar el reclamo,
// el historial anterior deja de estar al día.
watch(() => props.claim, () => {
  history.value = null;
  if (open.value || props.claim.status === ClaimStatus.IN_REVIEW) load();
}, { immediate: true });
</script>

<style scoped>
.timeline { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; }
.times { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
.time dt { font-size: 0.75rem; color: #7A8FA6; font-weight: 600; }
.time dd { margin: 0; font-size: 0.875rem; color: #1A2E4A; font-weight: 600; }
.link-btn { color: #009960; font-size: 0.8125rem; font-weight: 600; text-decoration: underline; padding: 0; }
.history { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; border-left: 2px solid #c5e8d8; padding-left: 0.75rem; }
.history-item { display: flex; flex-direction: column; }
.history-change { font-size: 0.875rem; font-weight: 600; color: #1A2E4A; }
.history-meta { font-size: 0.75rem; color: #3A4A5C; }
.history-empty { font-size: 0.8125rem; color: #3A4A5C; }
.history-error { font-size: 0.8125rem; color: #991b1b; }
</style>
