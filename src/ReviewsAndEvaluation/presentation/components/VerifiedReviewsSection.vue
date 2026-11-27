<template>
  <div class="card verified-reviews">
    <h3 class="section-title">{{ t('profile.reviews') }}</h3>

    <div v-if="failed" class="load-error" role="alert">
      <span>{{ t('reviews.verified.loadError') }}</span>
      <button type="button" class="btn btn-secondary btn-sm" @click="$emit('retry')">{{ t('reviews.verified.retry') }}</button>
    </div>
    <div v-else-if="!summary" class="loader-wrapper"><div class="spinner"></div></div>

    <div v-else-if="!summary.hasReviews()" class="empty-history">
      <p data-test="no-reviews">{{ t('reviews.verified.empty') }}</p>
      <p class="muted-text" data-test="completed">{{ completedLabel }}</p>
    </div>

    <template v-else>
      <div class="history-summary">
        <div class="history-score">
          <div class="average" data-test="average">{{ summary.averageRating()?.toFixed(1) }}</div>
          <div class="muted-text">{{ t('reviews.verified.average') }}</div>
          <div class="muted-text" data-test="count">{{ t('reviews.verified.count', { n: summary.verifiedReviewCount }, summary.verifiedReviewCount) }}</div>
          <div class="muted-text" data-test="completed">{{ completedLabel }}</div>
        </div>
        <ul class="distribution" :aria-label="t('reviews.verified.distribution')">
          <li v-for="row in summary.distribution" :key="row.stars" class="bar-row" :data-test="`stars-${row.stars}`">
            <span class="bar-label">{{ row.stars }} ★</span>
            <span class="bar"><span class="bar-fill" :style="{ width: summary.share(row.count) + '%' }"></span></span>
            <span class="bar-count">{{ row.count }}</span>
          </li>
        </ul>
      </div>

      <div class="history-controls">
        <label class="control">
          <span class="label">{{ t('reviews.verified.sortLabel') }}</span>
          <select :value="sort" class="input-field" data-test="sort" @change="$emit('update:sort', $event.target.value)">
            <option value="newest">{{ t('reviews.verified.sortNewest') }}</option>
            <option value="oldest">{{ t('reviews.verified.sortOldest') }}</option>
          </select>
        </label>
        <label v-if="serviceTypes.length" class="control">
          <span class="label">{{ t('search.serviceType') }}</span>
          <select :value="serviceType" class="input-field" data-test="service-filter" @change="$emit('update:serviceType', $event.target.value)">
            <option value="">{{ t('search.allServices') }}</option>
            <option v-for="type in serviceTypes" :key="type" :value="type">{{ serviceLabel(type) }}</option>
          </select>
        </label>
      </div>

      <div v-if="loading" class="loader-wrapper"><div class="spinner"></div></div>
      <p v-else-if="!reviews.length" class="muted-text">{{ t('reviews.verified.noMatches') }}</p>
      <ul v-else class="reviews-list">
        <li v-for="r in reviews" :key="r.id" class="review-row">
          <span class="verified-badge"><AppIcon name="checkCircle" :size="14" /> {{ t('reviews.verified.badge') }}</span>
          <div class="review-header">
            <span class="review-author">{{ r.clientName || t('auth.client') }}</span>
            <span class="review-stars" role="img" :aria-label="`${r.rating}/5`">
              <span v-for="i in 5" :key="i" :style="{ color: i <= r.rating ? '#f59e0b' : '#c5e8d8' }">★</span>
            </span>
          </div>
          <p class="review-service" data-test="service">{{ serviceLine(r) }}</p>
          <p class="review-text">{{ r.comment }}</p>
          <p v-if="r.createdAt" class="review-date">{{ t('reviews.verified.published', { date: longDate(new Date(r.createdAt)) }) }}</p>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
/**
 * Reseñas verificadas e historial del prestador/a (US34, tratamiento de EC-BLQ02).
 * Capa: ReviewsAndEvaluation / presentation / components
 */
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";
import { dateFromIsoDay, formatLongDate } from "../../../Shared/domain/format/dates.js";

const props = defineProps({
  summary: { type: Object, default: null },
  reviews: { type: Array, required: true },
  serviceTypes: { type: Array, required: true },
  sort: { type: String, required: true },
  serviceType: { type: String, required: true },
  loading: { type: Boolean, default: false },
  failed: { type: Boolean, default: false },
});
defineEmits(["update:sort", "update:serviceType", "retry"]);

const { t, te, locale } = useI18n();

const completedLabel = computed(() => {
  const n = props.summary?.completedServices ?? 0;
  return t("reviews.verified.completed", { n }, n);
});

const longDate = (date) => formatLongDate(date, locale.value);

function serviceLabel(type) {
  return te(`worker.services.${type}`) ? t(`worker.services.${type}`) : type;
}

/** "Servicio · fecha", con lo que el API haya enviado. */
function serviceLine(review) {
  const day = dateFromIsoDay(review.serviceDate);
  return [review.serviceType && serviceLabel(review.serviceType), day && longDate(day)]
    .filter(Boolean).join(" · ");
}
</script>

<style scoped>
.section-title { font-size: 1rem; font-weight: 700; color: #1A2E4A; margin-bottom: 0.875rem; }
.muted-text { color: #7A8FA6; font-size: 0.875rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 1.5rem 0; }
.load-error { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }
.empty-history { color: #3A4A5C; font-size: 0.9375rem; display: flex; flex-direction: column; gap: 0.375rem; }
.history-summary { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; }
.history-score { text-align: center; }
.average { font-size: 2.5rem; font-weight: 800; color: #1A2E4A; line-height: 1.1; }
.distribution { flex: 1; min-width: 200px; list-style: none; }
.bar-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #3A4A5C; }
.bar-label { width: 2.25rem; }
.bar { flex: 1; height: 8px; background: #E6F9F2; border-radius: 9999px; overflow: hidden; }
.bar-fill { display: block; height: 100%; background: #009960; }
.bar-count { width: 2rem; text-align: right; }
.history-controls { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.25rem 0; }
.control { flex: 1; min-width: 180px; }
.reviews-list { list-style: none; display: flex; flex-direction: column; gap: 1rem; }
.review-row { border-bottom: 1px solid #E6F9F2; padding-bottom: 1rem; }
.review-row:last-child { border-bottom: none; padding-bottom: 0; }
.verified-badge { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; color: #009960; background: #E6F9F2; padding: 0.2rem 0.625rem; border-radius: 9999px; margin-bottom: 0.5rem; }
.review-header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.review-author { font-weight: 600; font-size: 0.9375rem; color: #1A2E4A; }
.review-stars { font-size: 0.875rem; }
.review-service { font-size: 0.8125rem; color: #3A4A5C; font-weight: 600; margin-top: 0.125rem; }
.review-text { color: #3A4A5C; font-size: 0.875rem; margin: 0.25rem 0; white-space: pre-line; }
.review-date { font-size: 0.75rem; color: #7A8FA6; }
</style>
