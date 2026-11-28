/**
 * Ruta de inicio según el rol del usuario tras autenticarse.
 * Capa: Shared / domain / constants
 */
export function roleHomePath(role) {
  if (role === "worker") return "/worker/dashboard";
  if (role === "admin") return "/admin/memberships";
  return "/client/search";
}

/** Sección de seguridad de la cuenta de cada rol (US40). */
export function roleAccountPath(role) {
  if (role === "worker") return "/worker/account";
  if (role === "admin") return "/admin/account";
  return "/client/account";
}
