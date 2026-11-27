/**
 * Clasifica el fallo de una petición sin exponer detalles (errorType de US42).
 * Capa: Tracking / domain / services
 *
 * Mismos códigos que la app móvil: `http_<estado>`, `network` o `unexpected`.
 */
export function errorTypeOf(error) {
  if (error?.response?.status) return `http_${error.response.status}`;
  if (error?.request) return "network";
  return "unexpected";
}
