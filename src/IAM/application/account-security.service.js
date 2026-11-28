/**
 * Servicio de aplicación de la seguridad de la cuenta (US40).
 * Capa: IAM / application
 *
 * Mantiene en la sesión el aviso de cambio de contraseña pendiente.
 */
import { AccountSecurityApi } from "../infrastructure/account-security.api.js";
import { useAuthStore } from "./auth.store.js";

export const AccountSecurityService = {
  async getAccessActivity() {
    const activity = await AccountSecurityApi.getAccessActivity();
    useAuthStore().setPasswordChangeRequired(activity.passwordChangeRequired === true);
    return activity;
  },

  /** El API cierra las demás sesiones y pide cambiar la contraseña; esta sigue abierta. */
  async reportAccess(id) {
    await AccountSecurityApi.reportAccess(id);
    useAuthStore().setPasswordChangeRequired(true);
  },

  async changePassword(passwords) {
    const auth = useAuthStore();
    const withSession = auth.isLoggedIn;
    await AccountSecurityApi.changePassword(passwords, withSession ? null : auth.challengeToken);
    if (withSession) {
      auth.setPasswordChangeRequired(false);
    } else {
      // El token de cambio no abre sesión: hay que ingresar con la contraseña nueva.
      auth.clearChallengeToken();
      auth.setNotice("password_changed");
    }
  },
};
