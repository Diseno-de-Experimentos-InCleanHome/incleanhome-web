<template>
  <div class="card estimate-card">
    <h3 class="estimate-title">{{ t('booking.estimate.title') }}</h3>

    <p v-if="error" class="estimate-error" role="alert">{{ error }}</p>
    <p v-else-if="!estimate" class="estimate-empty">{{ t('booking.estimate.invalid') }}</p>
    <dl v-else class="estimate-rows" aria-live="polite">
      <div class="estimate-row">
        <dt>{{ t('booking.estimate.hourlyRate') }}</dt>
        <dd data-test="estimate-rate">{{ formatCurrency(estimate.hourlyRate) }}</dd>
      </div>
      <div class="estimate-row">
        <dt>{{ t('booking.estimate.duration') }}</dt>
        <dd data-test="estimate-hours">{{ t('booking.estimate.hoursValue', { hours: estimate.hours }) }}</dd>
      </div>
      <div class="estimate-row estimate-total">
        <dt>{{ t('booking.estimate.total') }}</dt>
        <dd data-test="estimate-total">{{ formatCurrency(estimate.totalAmount) }}</dd>
      </div>
    </dl>

    <p class="estimate-note">{{ t('booking.estimate.note') }}</p>
  </div>
</template>

<script setup>
/**
 * Monto estimado antes de confirmar la reserva (US41, tratamiento de EC-BLQ06).
 * Capa: Booking / presentation / components
 */
import { useI18n } from "vue-i18n";
import { formatCurrency } from "../../../Shared/domain/format/currency.js";

defineProps({
  /** { hourlyRate, hours, totalAmount } o null si el horario no permite estimar. */
  estimate: { type: Object, default: null },
  /** Motivo por el que el API rechazó la estimación. */
  error: { type: String, default: "" },
});

const { t } = useI18n();
</script>

<style scoped>
.estimate-card { background: #E6F9F2; border-color: #00B272; }
.estimate-title { font-weight: 700; color: #1A2E4A; font-size: 1.25rem; margin-bottom: 1rem; }
.estimate-rows { margin: 0; }
.estimate-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; font-size: 0.9375rem; margin-bottom: 0.375rem; color: #3A4A5C; }
.estimate-row dd { margin: 0; font-weight: 600; color: #1A2E4A; }
.estimate-total { border-top: 1px solid #00B272; margin: 0.75rem 0 0; padding-top: 0.75rem; }
.estimate-total dt { font-weight: 700; font-size: 1.0625rem; color: #009960; }
.estimate-total dd { font-weight: 800; font-size: 1.25rem; color: #009960; }
.estimate-empty { font-size: 0.9375rem; color: #3A4A5C; }
.estimate-error { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }
.estimate-note { margin-top: 0.75rem; font-size: 0.8125rem; color: #3A4A5C; line-height: 1.5; }
</style>
