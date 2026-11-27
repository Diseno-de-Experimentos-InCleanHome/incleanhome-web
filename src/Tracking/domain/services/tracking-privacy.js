/**
 * Reglas de privacidad 8.2.8 (US42, escenario 3).
 * Capa: Tracking / domain / services
 *
 * Una propiedad sobrevive solo si el plan la lista para ese evento y su valor tiene la forma
 * esperada: nunca contraseñas, tokens, direcciones ni contenido de mensajes o comentarios.
 */
import { CAPTURED_BY_CLIENT, PROPERTY_KINDS, allowedProperties } from "../model/tracking-plan.js";

const MAX_INTEGER = 2147483647;
const MAX_FILTERS = 20;
const PLATFORMS = ["web", "mobile", "api"];
export const ROLES = Object.freeze(["client", "worker", "admin"]);

const IDENTIFIER = /^[A-Za-z0-9_.:-]{1,64}$/;
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const CODE = /^[a-z][a-z0-9_]{0,39}$/;
const LABEL = /^[\p{L} '_-]{2,64}$/u;
// Siete o más dígitos seguidos parecen un teléfono o un documento.
const LONG_DIGITS = /\d{7,}/;
const ADDRESS_WORDS = /\b(av|avenida|jr|jir[oó]n|calle|psje|pasaje|mz|lote|dpto|nro)\b/i;

const isText = (value, test) => typeof value === "string" && test(value);
const isInteger = (value) => Number.isInteger(value) && value >= 0 && value <= MAX_INTEGER;
const isIdentifier = (value) => isText(value, (v) => IDENTIFIER.test(v) && !JWT.test(v));

const VALIDATORS = new Map([
  ["integer", isInteger],
  ["number", (v) => Number.isFinite(v) && v >= 0],
  ["boolean", (v) => typeof v === "boolean"],
  ["identifier", isIdentifier],
  ["code", (v) => isText(v, (s) => CODE.test(s) && !LONG_DIGITS.test(s))],
  ["label", (v) => isText(v, (s) => LABEL.test(s) && !ADDRESS_WORDS.test(s))],
  ["filters", (v) => isInteger(v) || (Array.isArray(v) && v.length <= MAX_FILTERS
    && v.every((item) => isIdentifier(item) && !LONG_DIGITS.test(item)))],
  ["platform", (v) => PLATFORMS.includes(v)],
  ["role", (v) => ROLES.includes(v)],
  // Solo el servidor puede marcar un evento como capturado por el servidor.
  ["capturedBy", (v) => v === CAPTURED_BY_CLIENT],
]);

export function sanitizeProperties(eventName, properties = {}) {
  const allowed = allowedProperties(eventName);
  if (!allowed) return {};

  return Object.fromEntries(Object.entries(properties).filter(([name, value]) =>
    allowed.includes(name) && VALIDATORS.get(PROPERTY_KINDS.get(name))?.(value) === true));
}
