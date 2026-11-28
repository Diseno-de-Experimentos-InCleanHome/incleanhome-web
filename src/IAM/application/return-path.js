/**
 * Regreso al enlace de un correo tras iniciar sesión (US35).
 * Capa: IAM / application
 *
 * Solo se recuerda el enlace de un recordatorio de reseña; en los demás casos el inicio de
 * sesión lleva a la pantalla de siempre.
 */
import { ReturnPathStorage } from "../../Shared/infrastructure/storage/return-path.storage.js";

export function rememberReturnPath(route) {
  if (route?.query?.reviewBookingId) ReturnPathStorage.set(route.fullPath);
}

/** La ruta recordada, si es del rol que ingresó. Se usa una sola vez. */
export function takeReturnPath(role) {
  const path = ReturnPathStorage.take();
  return path?.startsWith(`/${role}/`) ? path : null;
}
