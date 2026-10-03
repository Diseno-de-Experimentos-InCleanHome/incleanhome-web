/**
 * Ruta de inicio según el rol del usuario tras autenticarse.
 * Capa: Shared / domain / constants
 */
export function roleHomePath(role) {
  if (role === "worker") return "/worker/dashboard";
  if (role === "admin") return "/admin/memberships";
  return "/client/search";
}
