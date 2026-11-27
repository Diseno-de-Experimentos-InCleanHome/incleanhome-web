/**
 * Composable useAuthErrorMessage — texto de un error de acceso.
 * Capa: IAM / presentation / composables
 */
import { useI18n } from "vue-i18n";
import { isRateLimited, retryAfterSeconds } from "../../domain/services/rate-limit.js";

/**
 * @param {object} [options]
 * @param {string} [options.unauthorizedKey] Texto propio para un 401. Sin él se muestra el
 *   mensaje del API, porque en cada paso del acceso un 401 significa algo distinto.
 */
export function useAuthErrorMessage({ unauthorizedKey } = {}) {
  const { t } = useI18n();

  return function errorMessage(error) {
    if (isRateLimited(error)) {
      const seconds = retryAfterSeconds(error);
      return seconds === null ? t("auth.rateLimited") : t("auth.rateLimitedWait", { n: seconds }, seconds);
    }
    if (unauthorizedKey && error?.response?.status === 401) return t(unauthorizedKey);
    return error?.response?.data?.error || t("common.error");
  };
}
