/**
 * Evento de tracking: sobre con las propiedades comunes de 8.2.8 (US42).
 * Capa: Tracking / domain / model
 */
import { sha256, toHex } from "../../../Shared/domain/crypto/sha256.js";
import { PLATFORM } from "./tracking-plan.js";
import { ROLES, sanitizeProperties } from "../services/tracking-privacy.js";

function formatUuid(bytes, version) {
  const b = bytes.slice(0, 16);
  b[6] = (b[6] & 0x0f) | (version << 4);
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = toHex(b);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Identificador aleatorio (UUID v4). `crypto.randomUUID` exige un contexto seguro. */
export function newId() {
  return formatUuid(crypto.getRandomValues(new Uint8Array(16)), 4);
}

/** Identificador estable de una operación: repetirla produce el mismo eventId. */
export function idForOperation(operationKey) {
  return formatUuid(sha256(operationKey), 8);
}

/**
 * Referencia seudónima del usuario, igual a la de la app móvil; el API la reemplaza por un
 * HMAC antes de guardarla. Sin sesión se usa una referencia anónima de la visita, para que
 * el API no atribuya el evento a quien inicie sesión después en este navegador.
 */
export function userRefFor(userId, sessionId) {
  if (userId == null) return `anonymous:${sessionId}`;
  return toHex(sha256(`incleanhome-user:${userId}`).slice(0, 8));
}

export function createTrackingEvent({
  eventId, eventName, occurredAt, user, sessionId, environment, assignment, properties,
}) {
  const role = user?.role?.toLowerCase();
  const experiment = assignment?.inExperiment ? assignment : null;
  return {
    eventId,
    eventName,
    occurredAt,
    platform: PLATFORM,
    environment,
    userRole: ROLES.includes(role) ? role : null,
    userRef: userRefFor(user?.id, sessionId),
    sessionId,
    experimentId: experiment?.experimentId ?? null,
    variant: experiment?.variant ?? null,
    featureActive: experiment?.featureActive ?? null,
    properties: sanitizeProperties(eventName, properties),
  };
}
