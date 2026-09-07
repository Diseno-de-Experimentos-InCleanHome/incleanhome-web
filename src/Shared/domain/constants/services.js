/**
 * Tipos de servicio del dominio.
 * Capa: Shared / domain / constants
 *
 * Lista canónica de servicios que ofrecen las trabajadoras.
 * Se usa en Booking, Profiles, SearchAndCatalog y IAM (registro).
 *
 * Todos los strings coinciden con las claves de i18n (worker.services.*)
 * y con los valores que espera el backend.
 */
export const SERVICE_TYPES = Object.freeze([
  "limpieza_general",
  "cocina",
  "lavanderia",
  "planchado",
  "cuidado_ninos",
  "cuidado_adultos",
  "jardineria",
  "limpieza_profunda",
]);

/** Helper para armar { value, label } usando i18n */
export function buildServiceOptions(t) {
  return SERVICE_TYPES.map((value) => ({
    value,
    label: t(`worker.services.${value}`),
  }));
}
