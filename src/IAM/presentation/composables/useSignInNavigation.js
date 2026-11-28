/**
 * Composable useSignInNavigation — a dónde ir cuando termina el inicio de sesión.
 * Capa: IAM / presentation / composables
 */
import { useAuthStore } from "../../application/auth.store.js";
import { takeReturnPath } from "../../application/return-path.js";
import { roleHomePath, roleAccountPath } from "../../../Shared/domain/constants/roles.js";

export function useSignInNavigation() {
  const auth = useAuthStore();

  /** @param {{requiresPasswordChange?: boolean, user?: {role: string}}} result */
  return function pathAfterSignIn(result) {
    // US40: cambio obligatorio, todavía sin sesión.
    if (result.requiresPasswordChange) return "/change-password";
    // US35: se llegó desde el enlace de un recordatorio.
    const returnPath = takeReturnPath(result.user.role);
    if (returnPath) return returnPath;
    // US40: cambio solicitado tras reportar un acceso.
    if (auth.passwordChangeRequired) return `${roleAccountPath(result.user.role)}/password`;
    return roleHomePath(result.user.role);
  };
}
