/**
 * Composable useFormValidation — conecta los validadores del dominio con una vista.
 * Capa: Shared / presentation / composables
 *
 * `form` y `schema` pueden ser refs/computed (p. ej. un schema que depende del rol o
 * de mensajes traducidos) u objetos planos.
 */
import { ref, toValue } from "vue";
import { validate, validateField } from "../../domain/validation/validators.js";

export function useFormValidation(form, schema) {
  const errors = ref({});

  /** Para @blur / @change: valida un solo campo y actualiza su mensaje. */
  function touch(field) {
    const message = validateField(toValue(form), toValue(schema), field);
    if (message) errors.value[field] = message;
    else delete errors.value[field];
  }

  /** Valida todo antes de enviar. Devuelve true si no hay errores. */
  function validateAll() {
    errors.value = validate(toValue(form), toValue(schema));
    return Object.keys(errors.value).length === 0;
  }

  function resetErrors() {
    errors.value = {};
  }

  return { errors, touch, validateAll, resetErrors };
}
