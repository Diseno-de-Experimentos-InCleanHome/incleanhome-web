/**
 * Tiempos de atención de un reclamo (US36), en segundos desde su registro.
 * Capa: Claims / domain / services
 */
import { ClaimStatus, isClosed } from "../model/claim-status.value.js";
import { parseApiDate } from "../../../Shared/domain/format/dates.js";

export function secondsBetween(start, end) {
  const from = parseApiDate(start);
  const to = parseApiDate(end);
  return from && to ? Math.max(0, Math.round((to - from) / 1000)) : null;
}

/** La primera revisión es el cambio que sacó al reclamo del estado registrado. */
export function secondsToFirstReview(createdAt, history = []) {
  const first = history
    .filter((change) => change.previousStatus === ClaimStatus.REGISTERED)
    .map((change) => secondsBetween(createdAt, change.changedAt))
    .filter((seconds) => seconds !== null);
  return first.length ? Math.min(...first) : null;
}

/** Con los datos de la consulta pública: registro y fecha de cierre. */
export function secondsToClosure({ status, createdAt, resolvedAt }) {
  return isClosed(status) ? secondsBetween(createdAt, resolvedAt) : null;
}

/** "2 d 3 h", "3 h 15 min", "12 min" o "< 1 min"; las unidades son iguales en es y en. */
export function formatDuration(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return null;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} d ${hours % 24} h`;
  if (hours > 0) return `${hours} h ${minutes % 60} min`;
  return minutes > 0 ? `${minutes} min` : "< 1 min";
}
