/**
 * Value Object Experiment — catálogo de experimentos To-Be (US43).
 * Capa: Experiments / domain / model
 *
 * Los identificadores son los de las Experiment Cards del informe y los comparten la web,
 * la app móvil y el API, para poder unir los eventos de las tres plataformas.
 */
export const ExperimentId = Object.freeze({
  WORKER_SUGGESTIONS: "EC-BLQ01",   // US33
  VERIFIED_REVIEWS: "EC-BLQ02",     // US34
  REVIEW_REMINDER: "EC-BLQ03",      // US35
  BOOKING_ESTIMATE: "EC-BLQ06",     // US41
  SUPPORT_FAQ: "EC-BLQ04",          // US38
  SERVICE_AREA: "EC-BLQ01-SA",      // US32
});

export const Variant = Object.freeze({
  CONTROL: "control",
  TREATMENT: "treatment",
});

/**
 * - `abTest`: reparte usuarios entre control y tratamiento; si no, se activa por periodo.
 * - `role`: rol que participa; null cuando la funcionalidad es pública (también sin sesión).
 */
const DEFINITIONS = new Map([
  [ExperimentId.WORKER_SUGGESTIONS, { abTest: true, role: "client" }],
  [ExperimentId.VERIFIED_REVIEWS, { abTest: true, role: "client" }],
  [ExperimentId.REVIEW_REMINDER, { abTest: true, role: "client" }],
  [ExperimentId.BOOKING_ESTIMATE, { abTest: true, role: "client" }],
  // El libro de reclamaciones es público, así que US38 se activa para cualquier visitante.
  [ExperimentId.SUPPORT_FAQ, { abTest: false, role: null }],
  [ExperimentId.SERVICE_AREA, { abTest: false, role: "worker" }],
]);

export function experimentDefinition(experimentId) {
  return DEFINITIONS.get(experimentId) ?? null;
}
