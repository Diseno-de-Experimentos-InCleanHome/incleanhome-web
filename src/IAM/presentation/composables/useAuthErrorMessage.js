/**
 * Composable useAuthErrorMessage — texto de un error de acceso.
 * Capa: IAM / presentation / composables
 */
import { useI18n } from "vue-i18n";
import { isRateLimited, retryAfterSeconds } from "../../domain/services/rate-limit.js";

export function useAuthErrorMessage() {
  const { t } = useI18n();

  return function errorMessage(error) {
    if (isRateLimited(error)) {
      const seconds = retryAfterSeconds(error);
      return seconds === null ? t("auth.rateLimited") : t("auth.rateLimitedWait", { n: seconds }, seconds);
    }
    return error?.response?.data?.error || t("common.error");
  };
}
