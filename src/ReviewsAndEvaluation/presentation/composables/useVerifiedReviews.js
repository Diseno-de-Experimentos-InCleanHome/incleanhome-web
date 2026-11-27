/**
 * Composable useVerifiedReviews — estado del historial verificado de un perfil (US34).
 * Capa: ReviewsAndEvaluation / presentation / composables
 *
 * Como en la app móvil, solo se muestran las reseñas verificadas. El orden y el filtro por
 * servicio los resuelve el API.
 */
import { computed, ref, toValue, watch } from "vue";
import { ReviewService, ReviewSort } from "../../application/review.service.js";

/**
 * @param {object} source
 * @param source.enabled ref o getter: el usuario está en el tratamiento
 * @param source.workerId ref, getter o valor
 * @param source.allReviews ref o getter con las reseñas sin filtrar (más recientes primero)
 */
export function useVerifiedReviews({ enabled, workerId, allReviews }) {
  const summary = ref(null);
  const sort = ref(ReviewSort.NEWEST);
  const serviceType = ref("");
  const arranged = ref(null); // respuesta del API cuando hay otro orden o un filtro
  const loading = ref(false);
  const failed = ref(false);
  let latest = 0;

  const isDefaultArrangement = () => sort.value === ReviewSort.NEWEST && !serviceType.value;

  const serviceTypes = computed(() => [...new Set(
    toValue(allReviews).filter((r) => r.isVerified && r.serviceType).map((r) => r.serviceType),
  )].sort());

  const reviews = computed(() =>
    (arranged.value ?? toValue(allReviews)).filter((r) => r.isVerified));

  async function load() {
    const query = ++latest;
    const id = toValue(workerId);
    loading.value = true;
    failed.value = false;
    try {
      const [nextSummary, nextList] = await Promise.all([
        summary.value ?? ReviewService.getSummary(id),
        isDefaultArrangement()
          ? null
          : ReviewService.listForWorker(id, { sort: sort.value, serviceType: serviceType.value }),
      ]);
      if (query !== latest) return;
      summary.value = nextSummary;
      arranged.value = nextList;
    } catch {
      if (query === latest) failed.value = true;
    } finally {
      if (query === latest) loading.value = false;
    }
  }

  watch([() => toValue(enabled), sort, serviceType], ([active]) => {
    if (active) load();
  }, { immediate: true });

  return { summary, reviews, serviceTypes, sort, serviceType, loading, failed, retry: load };
}
