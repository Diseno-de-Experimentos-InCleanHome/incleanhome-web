/**
 * Zonas de trabajo (distritos de Lima).
 * Capa: Shared / domain / constants
 *
 * Lista canónica de zonas donde operan las trabajadoras.
 * Coincide con las claves de i18n (worker.zones.*) y con
 * los valores que espera el backend.
 */
export const ZONES = Object.freeze([
  "miraflores",
  "san_isidro",
  "surco",
  "la_molina",
  "barranco",
  "san_borja",
  "lince",
  "jesus_maria",
  "pueblo_libre",
  "magdalena",
  "san_miguel",
  "callao",
  "los_olivos",
  "san_martin",
  "ate",
  "comas",
]);

/** Helper para armar { value, label } usando i18n */
export function buildZoneOptions(t) {
  return ZONES.map((value) => ({
    value,
    label: t(`worker.zones.${value}`),
  }));
}
