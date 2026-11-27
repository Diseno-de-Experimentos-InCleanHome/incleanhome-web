/**
 * Servicio de dominio: asignación de variantes (US43).
 * Capa: Experiments / domain / services
 *
 * Reproduce ExperimentAssigner y ExperimentService de la app móvil y la fórmula del API:
 * bucket = primeros 4 bytes (big-endian, sin signo) de SHA-256("<experimentId>:<userId>")
 * módulo 100; el usuario está en tratamiento si bucket < treatmentPercent.
 */
import { sha256 } from "../../../Shared/domain/crypto/sha256.js";
import { Variant, experimentDefinition } from "../model/experiment.value.js";

export function bucket(experimentId, userId) {
  const digest = sha256(`${experimentId}:${userId}`);
  return new DataView(digest.buffer).getUint32(0) % 100;
}

export function variantFor(experimentId, userId, treatmentPercent) {
  return bucket(experimentId, userId) < treatmentPercent ? Variant.TREATMENT : Variant.CONTROL;
}

function assignment(experimentId, variant, inExperiment) {
  return Object.freeze({
    experimentId,
    variant,
    inExperiment,
    featureActive: inExperiment && variant === Variant.TREATMENT,
  });
}

/** Fuera del experimento rige el comportamiento actual. */
export const inactiveAssignment = (experimentId) => assignment(experimentId, Variant.CONTROL, false);

/**
 * Evalúa un experimento.
 *
 * @param {object} params
 * @param {{enabled: boolean, treatmentPercent: number}=} params.setting configuración vigente
 * @param {{id: number, role: string}|null} params.user usuario con sesión
 * @param {string|null} params.storedVariant variante ya asignada a este usuario; se conserva
 *   aunque cambie el porcentaje mientras el experimento siga activo.
 */
export function evaluateExperiment({ experimentId, setting, user, storedVariant = null }) {
  const definition = experimentDefinition(experimentId);
  if (!definition || !setting?.enabled) return inactiveAssignment(experimentId);

  if (definition.role !== null) {
    if (user?.id == null || user.role?.toLowerCase() !== definition.role) {
      return inactiveAssignment(experimentId);
    }
  }
  if (!definition.abTest) return assignment(experimentId, Variant.TREATMENT, true);

  const known = Object.values(Variant).includes(storedVariant);
  const variant = known ? storedVariant : variantFor(experimentId, user.id, setting.treatmentPercent);
  return assignment(experimentId, variant, true);
}
