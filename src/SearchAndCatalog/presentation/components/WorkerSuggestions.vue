<template>
  <section class="card suggestions-card" data-test="suggestions">
    <h3 class="card-subtitle"><AppIcon name="pin" :size="18" /> {{ t('suggestions.title') }}</h3>
    <p class="intro">{{ t('suggestions.intro') }}</p>

    <label class="label-bold" for="suggestion-district">{{ t('suggestions.district') }}</label>
    <select id="suggestion-district" v-model="district" class="input-field mt-1">
      <option value="" disabled>{{ t('serviceArea.selectDistrict') }}</option>
      <option v-for="d in DISTRICTS" :key="d.key" :value="d.key">{{ d.name }}</option>
    </select>

    <button type="button" class="btn btn-outline btn-full search-btn" data-test="suggestions-search"
      :disabled="loading" @click="search">
      {{ loading ? t('suggestions.searching') : t('suggestions.search') }}
    </button>

    <div v-if="error" class="error-box" role="alert">{{ error }}</div>

    <div v-if="results && !results.length" class="empty" data-test="suggestions-empty" role="status">
      <p>{{ t('suggestions.empty') }}</p>
      <router-link to="/client/search" class="btn btn-secondary btn-sm">{{ t('suggestions.useFilters') }}</router-link>
    </div>

    <ul v-else-if="results" class="result-list">
      <li v-for="w in results" :key="w.id" class="result" data-test="suggestion">
        <div class="result-info">
          <span class="result-name">{{ w.name }}</span>
          <span class="result-meta">
            <span>{{ w.averageRating ? `★ ${w.averageRating.toFixed(1)}` : t('suggestions.noRating') }}</span>
            <span>{{ distance(w.approxDistanceKm) }}</span>
            <span>{{ formatCurrency(w.hourlyRate) }}{{ t('search.perHour') }}</span>
          </span>
        </div>
        <span v-if="w.id === selectedWorkerId" class="chosen">
          <AppIcon name="check" :size="14" /> {{ t('suggestions.chosen') }}
        </span>
        <button v-else type="button" class="btn btn-primary btn-sm"
          :aria-label="t('suggestions.chooseNamed', { name: w.name })" @click="choose(w)">
          {{ t('suggestions.choose') }}
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
/**
 * US33 — prestadores/as sugeridos para la fecha, el horario y el distrito de la reserva.
 * La vista solo lo monta en el tratamiento de EC-BLQ01.
 */
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { SuggestionService } from "../../application/suggestion.service.js";
import { DISTRICTS } from "../../../Shared/domain/constants/districts.js";
import { DistrictStorage } from "../../../Shared/infrastructure/storage/district.storage.js";
import { formatCurrency } from "../../../Shared/domain/format/currency.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { TrackingService } from "../../../Tracking/application/tracking.service.js";
import { TrackingEventName } from "../../../Tracking/domain/model/tracking-plan.js";
import { newId } from "../../../Tracking/domain/model/tracking-event.entity.js";
import { ExperimentId } from "../../../Experiments/domain/model/experiment.value.js";

const props = defineProps({
  serviceType: { type: String, required: true },
  /** "YYYY-MM-DD", o vacío si todavía no se eligió. */
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  /** Duración del horario en horas. */
  hours: { type: Number, required: true },
  /** Prestador/a elegido desde las sugerencias, si es el de esta reserva. */
  selectedWorkerId: { type: Number, default: null },
});
/** `unavailable`: el API respondió 403 y la reserva debe seguir sin sugerencias. */
const emit = defineEmits(["select", "unavailable"]);

const { t } = useI18n();
const auth = useAuthStore();

const district = ref(DistrictStorage.get(auth.user?.id));
const results = ref(null);
const loading = ref(false);
const error = ref("");
let searchId = null;
let latest = 0;

const distance = (km) => (km === 0 ? t("suggestions.sameDistrict") : t("suggestions.distance", { km }));

function missing() {
  if (!props.serviceType) return "suggestions.needService";
  if (!props.date) return "suggestions.needDate";
  if (props.hours < 0.5) return "suggestions.needTime";
  return district.value ? null : "suggestions.needDistrict";
}

// Cambiar un dato deja sin efecto las sugerencias anteriores y las respuestas en camino.
watch(() => [props.serviceType, props.date, props.startTime, props.endTime, district.value], () => {
  latest += 1;
  results.value = null;
  loading.value = false;
  error.value = "";
});

function trackResults(request, count) {
  const options = { operationKey: searchId, experimentId: ExperimentId.WORKER_SUGGESTIONS };
  TrackingService.track(TrackingEventName.WORKER_SEARCH_PERFORMED, {
    searchId,
    searchMode: "suggestion",
    serviceCategory: request.serviceType,
    district: request.district,
    filtersApplied: 2,
    resultsCount: count,
  }, options);
  TrackingService.track(TrackingEventName.WORKER_SUGGESTIONS_SHOWN,
    { searchId, suggestionCount: count }, options);
}

async function search() {
  const problem = missing();
  error.value = problem ? t(problem) : "";
  if (problem) return;

  const query = ++latest;
  const { serviceType, date, startTime, endTime } = props;
  const request = { serviceType, date, startTime, endTime, district: district.value };
  DistrictStorage.set(auth.user?.id, district.value);
  results.value = null;
  loading.value = true;
  try {
    const found = await SuggestionService.suggest(request);
    if (query !== latest) return;
    searchId = newId();
    results.value = found;
    trackResults(request, found.length);
  } catch (e) {
    if (query !== latest) return;
    if (e.response?.status === 403) emit("unavailable");
    else error.value = (e.response?.status === 400 && e.response.data?.error) || t("common.error");
  } finally {
    if (query === latest) loading.value = false;
  }
}

function choose(worker) {
  emit("select", { workerId: worker.id, searchId });
}
</script>

<style scoped>
.card-subtitle { font-weight: 600; color: #1A2E4A; margin-bottom: 0.5rem; font-size: 1.125rem; display: flex; align-items: center; gap: 0.5rem; }
.intro { font-size: 0.875rem; color: #3A4A5C; margin: 0 0 1rem; }
.label-bold { font-size: 0.875rem; font-weight: 600; color: #3A4A5C; display: block; }
.mt-1 { margin-top: 0.25rem; }
.search-btn { margin-top: 0.75rem; }
.error-box { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; margin-top: 0.75rem; }
.empty { margin-top: 0.75rem; font-size: 0.875rem; color: #3A4A5C; }
.result-list { list-style: none; margin: 0.75rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.result { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; border: 1px solid #c5e8d8; border-radius: 0.75rem; padding: 0.75rem; }
.result-info { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.result-name { font-weight: 700; color: #1A2E4A; }
.result-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.8125rem; color: #3A4A5C; }
.chosen { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; font-weight: 600; color: #009960; }
</style>
