<template>
  <div class="view-container max-w-4xl">
    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>
    <div v-else-if="!worker" class="empty-state py-16"><p class="muted-text">Trabajadora no encontrada</p></div>
    <div v-else>
      <button @click="$router.back()" class="btn btn-secondary btn-sm mb-4">← {{ t('common.back') }}</button>

      <div class="profile-layout">
        <!-- Left: Profile card -->
        <div class="profile-sidebar">
          <div class="card text-center">
            <div class="worker-avatar-lg mx-auto mb-4" :style="{ background: avatarBg }">
              <span class="avatar-initials-lg">{{ initials }}</span>
            </div>
            <h1 class="profile-name">{{ worker.name }}</h1>

            <div class="rating-display mt-1">
              <span v-for="i in 5" :key="i" :style="{ color: i <= Math.round(worker.averageRating || 0) ? '#f59e0b' : '#c5e8d8' }">★</span>
              <span class="rating-value">{{ (worker.averageRating || 0).toFixed(1) }}</span>
              <span class="rating-count">({{ worker.totalServices || 0 }})</span>
            </div>

             <div class="worker-rate">S/. {{ worker.hourlyRate }}</div>
             <div class="per-hour">{{ t('search.perHour') }}</div>

            <div class="profile-actions mt-4">
              <router-link :to="`/client/worker/${worker.id}/book`" class="btn btn-primary btn-full"><AppIcon name="calendar" :size="16" /> {{ t('profile.book') }}</router-link>
              <router-link :to="`/client/messages/${worker.id}`" class="btn btn-secondary btn-full"><AppIcon name="chat" :size="16" /> {{ t('profile.contact') }}</router-link>
            </div>

            <div class="profile-info-section">
              <div v-if="worker.age" class="info-row"><AppIcon name="person" :size="16" /><span>{{ worker.age }} años</span></div>
              <div v-if="worker.gender" class="info-row"><AppIcon name="person" :size="16" /><span>{{ t(`worker.${worker.gender}`) }}</span></div>
              <div v-if="worker.experienceYears" class="info-row"><AppIcon name="clock" :size="16" /><span>{{ worker.experienceYears }} años de experiencia</span></div>
              <div v-if="worker.phone" class="info-row"><AppIcon name="phone" :size="16" /><span>{{ worker.phone }}</span></div>
            </div>
          </div>
        </div>

        <!-- Right: Details -->
        <div class="profile-main">
          <!-- Bio -->
          <div v-if="worker.bio" class="card">
              <h3 class="section-title">Acerca de mí</h3>
             <p class="bio-text">{{ worker.bio }}</p>
          </div>

          <!-- Services -->
          <div class="card">
            <h3 class="section-title">{{ t('profile.services') }}</h3>
              <div class="badge-group">
              <span v-for="svc in worker.serviceTypes" :key="svc" class="badge badge-blue badge-md">
                {{ t(`worker.services.${svc}`) }}
              </span>
            </div>
          </div>

          <!-- Zones -->
          <div class="card">
            <h3 class="section-title">{{ t('profile.workZones') }}</h3>
              <div class="badge-group">
              <span v-for="zone in worker.zones" :key="zone" class="badge badge-gray badge-md zone-badge">
                <AppIcon name="pin" :size="13" /> {{ t(`worker.zones.${zone}`) }}
              </span>
            </div>
          </div>

          <!-- Availability -->
          <div class="card">
            <h3 class="section-title">{{ t('profile.availability') }}</h3>
             <div v-if="availability.length === 0" class="muted-text">Sin disponibilidad configurada</div>
             <div v-else class="badge-group">
               <span v-for="slot in availability.filter(s => s.isAvailable)" :key="slot.id" class="badge badge-green badge-md">
                 {{ days[slot.dayOfWeek] }} {{ slot.startTime }}–{{ slot.endTime }}
               </span>
             </div>
          </div>

          <!-- Reviews -->
          <div class="card">
            <h3 class="section-title">{{ t('profile.reviews') }}</h3>
             <div v-if="reviews.length === 0" class="muted-text">{{ t('profile.noReviews') }}</div>
             <div v-else class="reviews-list">
               <div v-for="r in reviews" :key="r.id" class="review-row">
                 <div class="review-header mb-1">
                   <span class="review-author">{{ r.clientName || 'Cliente' }}</span>
                   <div class="review-stars">
                     <span v-for="i in 5" :key="i" :style="{ color: i <= r.rating ? '#f59e0b' : '#c5e8d8' }" class="review-star">★</span>
                   </div>
                 </div>
                 <p class="review-text">{{ r.comment }}</p>
                 <p class="review-date">{{ formatDate(r.createdAt) }}</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { CatalogService } from "../../application/catalog.service.js";
import { ReviewService } from "../../../ReviewsAndEvaluation/application/review.service.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const route = useRoute();
const worker = ref(null);
const availability = ref([]);
const reviews = ref([]);
const loading = ref(true);

const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const colors = ["#009960","#1A2E4A","#00B272","#00B272","#f59e0b","#ef4444"];
const initials = computed(() => worker.value?.initials?.() || "?");
const avatarBg = computed(() => colors[(worker.value?.id || 0) % colors.length]);

function formatDate(d) { return d ? new Date(d).toLocaleDateString("es-PE", { year:"numeric", month:"long", day:"numeric" }) : ""; }

onMounted(async () => {
  try {
    const id = route.params.id;
    const [w, av, rv] = await Promise.all([
      CatalogService.getWorker(id),
      CatalogService.getWorkerAvailability(id),
      ReviewService.listForWorker(id),
    ]);
    worker.value = w;
    availability.value = av;
    reviews.value = rv;
  } catch { } finally { loading.value = false; }
});
</script>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; padding: 1rem 0; }
.max-w-4xl { max-width: 896px; margin: 0 auto; }
.mb-4 { margin-bottom: 1rem; }

.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }
.empty-state { text-align: center; padding: 4rem 0; }
.muted-text { color:#7A8FA6; font-size:0.875rem; }

.profile-layout { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
@media (min-width: 1024px) {
  .profile-layout { grid-template-columns: 1fr 2fr; }
}

.text-center { text-align: center; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-1 { margin-top: 0.25rem; }
.mt-4 { margin-top: 1rem; }
.mb-1 { margin-bottom: 0.25rem; }

.worker-avatar-lg { width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center; }
.avatar-initials-lg { font-size:2rem;font-weight:700;color:white; }
.profile-name { font-size:1.375rem;font-weight:800;color:#1A2E4A; margin:0; }

.rating-display { display: flex; align-items: center; justify-content: center; gap: 0.25rem; }
.rating-value { font-size:0.875rem; font-weight:600; color:#1A2E4A; margin-left:0.25rem; }
.rating-count { font-size:0.8125rem; color:#7A8FA6; }

.worker-rate { font-size:1.5rem; font-weight:800; color:#009960; margin-top:1rem; }
.per-hour { font-size:0.8125rem; color:#3A4A5C; }

.profile-actions { display: flex; flex-direction: column; gap: 0.5rem; }
.profile-info-section { border-top:1px solid #c5e8d8; margin-top:1.25rem; padding-top:1.25rem; text-align:left; }
.info-row { display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;color:#3A4A5C;margin-bottom:0.5rem; }

.profile-main { display: flex; flex-direction: column; gap: 1.25rem; }
.section-title { font-size:1rem;font-weight:700;color:#1A2E4A;margin-bottom:0.875rem; }
.bio-text { color:#3A4A5C; line-height:1.6; font-size:0.9375rem; margin: 0; }

.badge-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.badge-md { font-size:0.875rem; padding:0.375rem 0.875rem; }
.badge-green { background:#E6F9F2; color:#009960; }
.zone-badge { display: inline-flex; align-items: center; gap: 0.3rem; }

.reviews-list { display: flex; flex-direction: column; gap: 1rem; }
.review-row { border-bottom:1px solid #E6F9F2; padding-bottom:1rem; }
.review-row:last-child { border-bottom: none; padding-bottom: 0; }
.review-header { display: flex; align-items: center; justify-content: space-between; }
.review-author { font-weight:600; font-size:0.9375rem; color:#1A2E4A; }
.review-stars { display: flex; }
.review-star { font-size:0.875rem; margin-left:0.125rem; }
.review-text { color:#3A4A5C; font-size:0.875rem; margin-top: 0.25rem; margin-bottom: 0.25rem; }
.review-date { font-size:0.75rem; color:#7A8FA6; margin-top:0.25rem; }

.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:28px; height:28px; animation: spin 1s linear infinite; }
.spinner-lg { width:36px; height:36px; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 767px) {
  .worker-avatar-lg { width:72px; height:72px; }
  .avatar-initials-lg { font-size:1.5rem; }
  .worker-rate { font-size:1.25rem; }
}
</style>
