/**
 * Límite de intentos de acceso (US39).
 * Capa: IAM / domain / services
 *
 * El API responde 429 con { error, retryAfterSeconds } y la cabecera Retry-After.
 */
export const isRateLimited = (error) => error?.response?.status === 429;

/** Segundos que hay que esperar; null si la respuesta no los indica. */
export function retryAfterSeconds(error) {
  const { data, headers } = error?.response ?? {};
  for (const value of [data?.retryAfterSeconds, headers?.["retry-after"]]) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
  }
  return null;
}
