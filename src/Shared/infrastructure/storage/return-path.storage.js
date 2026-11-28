/**
 * Ruta a la que volver tras iniciar sesión (US35). Dura lo que dure la pestaña.
 * Capa: Shared / infrastructure / storage
 */
const KEY = "inclean_return_path";

export const ReturnPathStorage = {
  set(path) {
    try {
      sessionStorage.setItem(KEY, path);
    } catch {
      // Sin almacenamiento se pierde el regreso, no el inicio de sesión.
    }
  },
  /** Devuelve la ruta guardada y la olvida. */
  take() {
    try {
      const path = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
      return path;
    } catch {
      return null;
    }
  },
};
