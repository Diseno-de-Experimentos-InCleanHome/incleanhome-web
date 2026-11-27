<template>
  <div class="page-wrapper">
    <div class="page-container">
      <router-link :to="homeLink" class="logo-wrapper-link">
        <div class="logo-small">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <span class="brand">InClean<span class="brand-accent">Home</span></span>
      </router-link>

      <div v-if="!isActive" class="loader-wrapper"><div class="spinner"></div></div>

      <div v-else class="card card-elevated">
        <h1 class="card-title">{{ t('support.title') }}</h1>
        <p class="card-subtitle">{{ t('support.intro') }}</p>

        <div class="categories" role="group" :aria-label="t('support.categoriesLabel')">
          <button v-for="id in FAQ_CATEGORIES" :key="id" type="button" :data-test="`category-${id}`"
            :class="['btn btn-sm', id === category ? 'btn-primary' : 'btn-secondary']"
            :aria-pressed="id === category" @click="selectCategory(id)">
            {{ t(`support.categories.${id}`) }}
          </button>
        </div>

        <ul class="faq-list">
          <li v-for="faq in faqByCategory(category)" :key="faq.id" class="faq" :data-test="faq.id">
            <button type="button" class="faq-question" :aria-expanded="expanded === faq.id" @click="toggle(faq)">
              <span>{{ t(`support.items.${faq.id}.question`) }}</span>
              <span class="faq-sign" aria-hidden="true">{{ expanded === faq.id ? '−' : '+' }}</span>
            </button>
            <div v-if="expanded === faq.id" class="faq-body">
              <p class="faq-answer">{{ t(`support.items.${faq.id}.answer`) }}</p>
              <p v-if="resolved.has(faq.id)" class="faq-thanks" role="status">{{ t('support.thanks') }}</p>
              <template v-else>
                <p class="faq-prompt">{{ t('support.solvedQuestion') }}</p>
                <div class="faq-actions">
                  <button type="button" class="btn btn-primary btn-sm" data-test="solved" @click="markResolved(faq)">{{ t('support.yes') }}</button>
                  <router-link :to="{ path: '/reclamos', query: { categoria: faq.category } }" class="btn btn-secondary btn-sm" data-test="not-solved">{{ t('support.no') }}</router-link>
                </div>
              </template>
            </div>
          </li>
        </ul>

        <router-link to="/reclamos" class="btn btn-outline btn-full" data-test="direct-claim">{{ t('support.directClaim') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Soluciones a problemas frecuentes antes de registrar un reclamo (US38, EC-BLQ04).
 * Capa: Support / presentation / views
 *
 * Vista pública. Con el experimento apagado no existe: lleva al Libro de Reclamaciones.
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { roleHomePath } from "../../../Shared/domain/constants/roles.js";
import { ExperimentId } from "../../../Experiments/domain/model/experiment.value.js";
import { useExperiment } from "../../../Experiments/presentation/composables/useExperiment.js";
import { TrackingService } from "../../../Tracking/application/tracking.service.js";
import { TrackingEventName } from "../../../Tracking/domain/model/tracking-plan.js";
import { newId } from "../../../Tracking/domain/model/tracking-event.entity.js";
import { FAQ_CATEGORIES, FaqCategory, faqByCategory } from "../../domain/model/faq.catalog.js";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const homeLink = computed(() => (auth.isLoggedIn ? roleHomePath(auth.user?.role) : "/login"));

const { isActive, whenReady } = useExperiment(ExperimentId.SUPPORT_FAQ);
const category = ref(FaqCategory.BOOKINGS);
const expanded = ref(null);
const resolved = ref(new Set());
// Identifica la visita: cada pregunta se registra como vista o resuelta una sola vez en ella.
const visitId = newId();

function trackFaq(eventName, faq) {
  TrackingService.track(eventName, { category: faq.category, faqId: faq.id },
    { operationKey: `${visitId}:${faq.id}`, experimentId: ExperimentId.SUPPORT_FAQ });
}

function selectCategory(id) {
  category.value = id;
  expanded.value = null;
}

function toggle(faq) {
  const opening = expanded.value !== faq.id;
  expanded.value = opening ? faq.id : null;
  if (opening) trackFaq(TrackingEventName.FAQ_VIEWED, faq);
}

/** La consulta queda registrada como resuelta sin crear un reclamo. */
function markResolved(faq) {
  resolved.value = new Set([...resolved.value, faq.id]);
  trackFaq(TrackingEventName.FAQ_RESOLVED, faq);
}

onMounted(async () => {
  await whenReady();
  if (!isActive.value) router.replace("/reclamos");
});
</script>

<style scoped>
.page-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.page-container { width: 100%; max-width: 560px; }
.logo-wrapper-link { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; text-decoration: none; }
.logo-small { width:40px; height:40px; background: linear-gradient(135deg,#009960,#00B272); border-radius:12px; display:flex; align-items:center; justify-content:center; }
.brand { font-size:1.5rem; font-weight:800; color:#1A2E4A; }
.brand-accent { color:#009960; }
.card-elevated { box-shadow:0 20px 40px rgba(0,0,0,0.08); padding: 2rem; }
.card-title { font-size:1.25rem; font-weight:700; color:#1A2E4A; margin-bottom:0.5rem; }
.card-subtitle { color:#3A4A5C; font-size:0.875rem; margin-bottom:1.25rem; line-height: 1.5; }
.loader-wrapper { display: flex; justify-content: center; padding: 3rem 0; }
.categories { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.faq-list { list-style: none; display: flex; flex-direction: column; gap: 0.625rem; margin-bottom: 1.25rem; }
.faq { border: 1px solid #c5e8d8; border-radius: 0.75rem; }
.faq-question { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; text-align: left; padding: 0.875rem; font-weight: 600; color: #1A2E4A; }
.faq-sign { color: #009960; font-size: 1.25rem; line-height: 1; }
.faq-body { padding: 0 0.875rem 0.875rem; }
.faq-answer { font-size: 0.9375rem; color: #3A4A5C; line-height: 1.5; margin-bottom: 0.875rem; }
.faq-prompt { font-size: 0.8125rem; font-weight: 600; color: #1A2E4A; margin-bottom: 0.5rem; }
.faq-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.faq-thanks { color: #007a4d; font-weight: 600; font-size: 0.875rem; }
</style>
