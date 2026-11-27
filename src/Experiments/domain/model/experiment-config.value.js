/**
 * Value Object ExperimentConfig — configuración de GET /experiments/config.
 * Capa: Experiments / domain / model
 */
import { experimentDefinition } from "./experiment.value.js";

/**
 * Convierte la respuesta `{ experiments: [{ id, enabled, treatmentPercent }] }` en un
 * Map id -> { enabled, treatmentPercent }. Los identificadores desconocidos y las entradas
 * mal formadas se ignoran, para que un valor erróneo nunca active una funcionalidad.
 *
 * Devuelve null si la respuesta no tiene la forma esperada.
 */
export function parseExperimentConfig(response) {
  if (!Array.isArray(response?.experiments)) return null;

  const settings = new Map();
  for (const entry of response.experiments) {
    const percent = entry?.treatmentPercent;
    if (!experimentDefinition(entry?.id)) continue;
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) continue;
    settings.set(entry.id, { enabled: entry.enabled === true, treatmentPercent: percent });
  }
  return settings;
}
