/**
 * Sesiones cerradas (US40).
 * Capa: IAM / application
 *
 * Cuando el API responde 401 a una petición hecha con el token de la sesión, esa sesión ya
 * no sirve: venció o se cerró desde otro dispositivo.
 */
import { AuthStorage } from "../../Shared/infrastructure/storage/auth.storage.js";

/** En los pasos del acceso un 401 significa otra cosa (credenciales o reto no válidos). */
const SIGN_IN_PATHS = ["/auth/login", "/auth/register/", "/auth/accept-terms", "/auth/2fa/"];

export function isSessionClosed(error) {
  if (error?.response?.status !== 401) return false;
  const token = AuthStorage.getToken();
  const { url = "", headers } = error.config ?? {};
  if (!token || SIGN_IN_PATHS.some((path) => url.startsWith(path))) return false;
  // Una respuesta atrasada de una sesión anterior no cierra la actual.
  return headers?.Authorization === `Bearer ${token}`;
}

export function installSessionGuard({ client, onClosed }) {
  client.interceptors.response.use(undefined, (error) => {
    if (isSessionClosed(error)) onClosed();
    return Promise.reject(error);
  });
}
