/**
 * Value Object ServiceArea — distrito base y radio de atención (US32).
 * Capa: Profiles / domain / model
 */

/** Límites del radio, en km. El API valida los suyos (1 a 15 por defecto). */
export const RADIUS_MIN = 1;
export const RADIUS_MAX = 15;

export function isValidRadius(value) {
  const radius = typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  return Number.isInteger(radius) && radius >= RADIUS_MIN && radius <= RADIUS_MAX;
}
