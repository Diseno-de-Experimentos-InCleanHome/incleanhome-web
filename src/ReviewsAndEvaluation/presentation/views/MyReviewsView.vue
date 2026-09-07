<template>
  <div class="view-container max-w-4xl">
    <h1 class="page-title mb-6">{{ t('profile.reviews') }}</h1>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <div v-else>
      <!-- Summary card -->
      <div class="card mb-6 summary-card">
        <div class="summary-layout">
          <div class="summary-score">
            <div class="avg-rating">{{ avgRating.toFixed(1) }}</div>
            <div class="stars-large">
              <span v-for="i in 5" :key="i" class="star-large" :style="{ color: i <= Math.round(avgRating) ? '#f59e0b' : '#c5e8d8' }">★</span>
            </div>
            <div class="summary-meta">{{ reviews.length }} {{ t('reviews.total') }}</div>
          </div>
          <div class="summary-bars">
            <div v-for="n in [5,4,3,2,1]" :key="n" class="bar-row mb-1">
              <span class="rating-num">{{ n }}</span>
              <span class="rating-star">★</span>
              <div class="rating-bar">
                <div :style="{ width: starPercent(n) + '%' }" class="rating-bar-fill"></div>
              </div>
              <span class="rating-count">{{ starCount(n) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!reviews.length" class="card empty-state py-12 text-center">
        <AppIcon name="star" :size="44" class="empty-icon" />
        <p class="empty-text">{{ t('profile.noReviews') }}</p>
      </div>

      <div v-else class="reviews-list">
        <div v-for="r in reviews" :key="r.id" class="card">
          <div class="review-header">
            <div class="review-author-info">
              <div class="avatar-circle">
                <span class="avatar-initial">{{ (r.clientName || 'C')[0] }}</span>
              </div>
              <div>
                <div class="review-author">{{ r.clientName || 'Cliente' }}</div>
                <div class="review-date">{{ formatDate(r.createdAt) }}</div>
              </div>
            </div>
            <div class="review-stars">
              <span v-for="i in 5" :key="i" class="review-star" :style="{ color: i <= r.rating ? '#f59e0b' : '#c5e8d8' }">★</span>
            </div>
          </div>
          <p v-if="r.comment" class="review-comment">{{ r.comment }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { ReviewService } from "../../application/review.service.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const auth = useAuthStore();
const reviews = ref([]);
const loading = ref(true);

const avgRating = computed(() => {
  if (!reviews.value.length) return 0;
  return reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length;
});

function starCount(n) { return reviews.value.filter(r => r.rating === n).length; }
function starPercent(n) { return reviews.value.length ? (starCount(n) / reviews.value.length) * 100 : 0; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("es-PE", { year:"numeric", month:"long", day:"numeric" }) : ""; }

onMounted(async () => {
  try {
    reviews.value = await ReviewService.listForWorker(auth.user?.id);
  } catch {} finally { loading.value = false; }
});
</script>

<style scoped>
.view-container { max-width: 896px; margin: 0 auto; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; }
.mb-6 { margin-bottom: 1.5rem; }

.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }

.summary-card { background: linear-gradient(135deg,#E6F9F2,#E6F9F2); padding: 2rem; }
.summary-layout { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
@media (min-width: 640px) { .summary-layout { flex-wrap: nowrap; } }

.summary-score { text-align: center; }
.avg-rating { font-size: 3rem; font-weight: 800; color: #1A2E4A; line-height: 1; }
@media (max-width: 640px) { .avg-rating { font-size: 2.5rem; } }

.stars-large { display: flex; justify-content: center; margin-top: 0.5rem; }
.star-large { font-size: 1.25rem; color: #c5e8d8; }
.summary-meta { font-size: 0.8125rem; color: #3A4A5C; margin-top: 0.25rem; }

.summary-bars { flex: 1; min-width: 200px; width: 100%; }
.bar-row { display: flex; align-items: center; gap: 0.5rem; }
.mb-1 { margin-bottom: 0.25rem; }

.rating-num { font-size: 0.8125rem; color: #3A4A5C; width: 12px; text-align: right; }
.rating-star { color: #f59e0b; font-size: 0.875rem; }
.rating-bar { flex: 1; height: 6px; background: #c5e8d8; border-radius: 9999px; overflow: hidden; }
.rating-bar-fill { height: 100%; background: #f59e0b; border-radius: 9999px; transition: width 0.3s ease; }
.rating-count { font-size: 0.75rem; color: #7A8FA6; width: 28px; }

.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.text-center { text-align: center; }
.empty-state .empty-icon { color: #7A8FA6; margin-bottom: 1rem; }
.empty-text { color: #3A4A5C; }

.reviews-list { display: flex; flex-direction: column; gap: 1rem; }

.review-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
@media (min-width: 640px) { .review-header { flex-wrap: nowrap; } }

.review-author-info { display: flex; align-items: center; gap: 0.75rem; }

.avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: #009960; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.avatar-initial { color: white; font-weight: 700; font-size: 0.875rem; }

.review-author { font-weight: 700; color: #1A2E4A; }
.review-date { font-size: 0.75rem; color: #7A8FA6; }

.review-stars { display: flex; }
.review-star { font-size: 1.125rem; margin-left: 0.125rem; color: #c5e8d8; }

.review-comment { margin-top: 1rem; color: #3A4A5C; font-size: 0.9375rem; line-height: 1.6; }

.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; }
.spinner-lg { width: 36px; height: 36px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
