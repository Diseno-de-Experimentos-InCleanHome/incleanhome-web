/**
 * Value Object ClaimStatus — ciclo de vida de un reclamo (US36).
 * Capa: Claims / domain / model
 *
 * registered pasa a in_review, resolved o rejected; in_review puede actualizar la nota o
 * cerrar; resolved y rejected son definitivos.
 */
export const ClaimStatus = Object.freeze({
  REGISTERED: "registered",
  IN_REVIEW: "in_review",
  RESOLVED: "resolved",
  REJECTED: "rejected",
});

export const CLAIM_STATUSES = Object.freeze(Object.values(ClaimStatus));

export const isClosed = (status) => status === ClaimStatus.RESOLVED || status === ClaimStatus.REJECTED;

/** Estados que el administrador puede elegir; ninguno si el reclamo ya está cerrado. */
export function nextStatuses(status) {
  const open = status === ClaimStatus.REGISTERED || status === ClaimStatus.IN_REVIEW;
  return open ? [ClaimStatus.IN_REVIEW, ClaimStatus.RESOLVED, ClaimStatus.REJECTED] : [];
}
