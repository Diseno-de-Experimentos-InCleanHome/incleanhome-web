<template>
  <router-link :to="`/client/worker/${worker.id}`" class="block no-underline">
    <div class="card worker-card hover:shadow-md transition-shadow cursor-pointer">
      <div class="flex items-start gap-3">
        <!-- Avatar -->
        <div class="worker-avatar" :style="{ background: avatarBg }">
          <span class="avatar-initials">{{ initials }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
              <div>
              <h3 class="worker-name">{{ worker.name }}</h3>
              <div class="flex items-center gap-1 mt-0.5 rating-row">
                <span class="rating-star">★</span>
                <span class="rating-value">{{ worker.averageRating?.toFixed(1) || '—' }}</span>
                <span class="rating-count">({{ worker.totalServices || 0 }} servicios)</span>
              </div>
            </div>
              <div class="price-col">
               <div class="price">S/. {{ worker.hourlyRate }}</div>
               <div class="per-hour">{{ t('search.perHour') }}</div>
             </div>
          </div>
        </div>
      </div>

      <!-- Services -->
      <div class="flex flex-wrap gap-1.5 mt-3 services-row">
        <span v-for="svc in worker.serviceTypes.slice(0,3)" :key="svc" class="badge badge-blue">
          {{ t(`worker.services.${svc}`) }}
        </span>
        <span v-if="worker.serviceTypes.length > 3" class="badge badge-gray">+{{ worker.serviceTypes.length - 3 }}</span>
      </div>

      <!-- Zones & experience -->
      <div class="flex items-center gap-3 mt-3 info-row">
        <span class="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ worker.zones.slice(0,2).map(z => t(`worker.zones.${z}`)).join(', ') }}
        </span>
        <span v-if="worker.experienceYears" class="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {{ worker.experienceYears }} {{ t('search.experience') }}
        </span>
      </div>

       <button class="btn btn-outline btn-sm btn-full mt-4">{{ t('search.viewProfile') }}</button>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const props = defineProps({ worker: Object });

const initials = computed(() => props.worker.name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() || "?");
const colors = ["#009960","#1A2E4A","#00B272","#00B272","#f59e0b","#ef4444"];
const avatarBg = computed(() => colors[props.worker.id % colors.length]);
</script>

<style scoped>
.worker-card { border-radius: 1rem; padding: 1.25rem; }
.worker-avatar { width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.avatar-initials { font-size:1.25rem; font-weight:700; color:#fff; }
.worker-name { font-weight:700; font-size:1rem; color:#1A2E4A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.price-col { text-align:right; flex-shrink:0; }
.price { font-size:1.125rem; font-weight:800; color:#009960; }
.per-hour { font-size:0.75rem; color:#3A4A5C; }
.rating-row { margin-top:0.125rem; }
.rating-star { color:#f59e0b; font-size:0.875rem; }
.rating-value { font-size:0.8125rem; font-weight:600; color:#1A2E4A; }
.rating-count { font-size:0.75rem; color:#7A8FA6; }
.services-row { margin-top:0.75rem; }
.info-row { font-size:0.8125rem; color:#3A4A5C; }
.badge { display:inline-flex; align-items:center; border-radius:9999px; padding:0.25rem 0.5rem; font-size:0.75rem; }
.badge-blue { background:#E6F9F2; color:#1A2E4A; }
.badge-gray { background:#E6F9F2; color:#3A4A5C; }
.btn { display:inline-flex; align-items:center; justify-content:center; border-radius:0.5rem; padding:0.5rem 0.75rem; cursor:pointer; }
.btn-full { width:100%; }
.btn-sm { font-size:0.875rem; padding:0.375rem 0.5rem; }
.btn-outline { border:1px solid #c5e8d8; background:white; }

/* Responsive adjustments */
@media (max-width: 640px) {
  .worker-card { padding: 0.875rem; }
  .worker-avatar { width:48px; height:48px; }
  .price { font-size:1rem; }
}
</style>

