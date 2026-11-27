/**
 * Composable useExperiment — estado de un experimento para las vistas (US43).
 * Capa: Experiments / presentation / composables
 *
 * Uso:
 *   const { isActive, whenReady } = useExperiment(ExperimentId.BOOKING_ESTIMATE);
 *   <section v-if="isActive">…</section>
 *
 * `isActive` es false si el experimento está apagado, el usuario está en control o su rol
 * no participa; en esos casos la vista debe mostrar el comportamiento actual.
 */
import { computed } from "vue";
import { useExperimentStore } from "../../application/experiment.store.js";

export function useExperiment(experimentId) {
  const store = useExperimentStore();
  const assignment = computed(() => store.assignmentFor(experimentId));
  const isActive = computed(() => assignment.value.featureActive);
  const isReady = computed(() => store.isReady);

  /** Resuelve cuando la configuración terminó de cargar (con éxito o no). */
  const whenReady = () => store.load();

  return { assignment, isActive, isReady, whenReady };
}
