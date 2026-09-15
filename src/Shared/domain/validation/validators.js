/**
 * Validadores de formularios.
 * Capa: Shared / domain / validation
 *
 * Funciones puras, sin dependencias de Vue. Cada fábrica (required(), minLength(8), …)
 * devuelve una regla `(value, form) => string | null`: null si es válido o el mensaje
 * de error en español. Todas aceptan un mensaje propio como último argumento, para
 * que las vistas puedan pasar un texto traducido con i18n.
 *
 * Salvo `required`, las reglas dan por válido un valor vacío: así un campo opcional
 * solo se valida cuando el usuario escribe algo.
 *
 * Los límites y patrones deben coincidir con los del backend.
 */

/** Límites de longitud / rango compartidos por las vistas. */
export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  bioMax: 500,
  ageMin: 18,
  ageMax: 70,
  experienceMin: 0,
  experienceMax: 50,
  hourlyRateMin: 10,
  addressMax: 200,
  bookingNotesMax: 500,
  eventTitleMax: 100,
  eventDescriptionMax: 1000,
  workersNeededMin: 1,
  claimDescriptionMax: 2000,
  claimRequestMax: 1000,
  relatedServiceMax: 200,
};

export const PATTERNS = {
  personName: /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  peruPhone: /^(?:\+?51)?9\d{8}$/,
  document: /^\d{8,12}$/,
  totpCode: /^\d{6}$/,
  strongPassword: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
};

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const required = (message = "Este campo es obligatorio") =>
  (value) => (isEmpty(value) ? message : null);

export const minLength = (n, message = `Debe tener al menos ${n} caracteres`) =>
  (value) => (isEmpty(value) || String(value).trim().length >= n ? null : message);

export const maxLength = (n, message = `Debe tener como máximo ${n} caracteres`) =>
  (value) => (isEmpty(value) || String(value).length <= n ? null : message);

export const pattern = (regex, message = "El formato no es válido") =>
  (value) => (isEmpty(value) || regex.test(String(value)) ? null : message);

export const personName = (message = "Solo se permiten letras y espacios") =>
  (value) => (isEmpty(value) || PATTERNS.personName.test(String(value).trim()) ? null : message);

export const email = (message = "Ingresa un correo electrónico válido") =>
  (value) => (isEmpty(value) || PATTERNS.email.test(String(value).trim()) ? null : message);

export const peruPhone = (message = "Ingresa un celular válido de 9 dígitos que empiece con 9") =>
  (value) => (isEmpty(value) || PATTERNS.peruPhone.test(String(value).replace(/[\s-]/g, "")) ? null : message);

export const document = (message = "El documento debe tener entre 8 y 12 dígitos") =>
  (value) => (isEmpty(value) || PATTERNS.document.test(String(value).trim()) ? null : message);

export const totpCode = (message = "El código debe tener 6 dígitos") =>
  (value) => (isEmpty(value) || PATTERNS.totpCode.test(String(value).trim()) ? null : message);

export const integer = (message = "Debe ser un número entero") =>
  (value) => (isEmpty(value) || /^-?\d+$/.test(String(value).trim()) ? null : message);

export const numeric = (message = "Debe ser un número") =>
  (value) => (isEmpty(value) || (String(value).trim() !== "" && Number.isFinite(Number(value))) ? null : message);

export const min = (n, message = `El valor mínimo es ${n}`) =>
  (value) => (isEmpty(value) || !Number.isFinite(Number(value)) || Number(value) >= n ? null : message);

export const max = (n, message = `El valor máximo es ${n}`) =>
  (value) => (isEmpty(value) || !Number.isFinite(Number(value)) || Number(value) <= n ? null : message);

export const strongPassword = (message = "Debe tener al menos 8 caracteres, con letras y números") =>
  (value) => (isEmpty(value) || PATTERNS.strongPassword.test(String(value)) ? null : message);

export const minItems = (n, message = `Selecciona al menos ${n} ${n === 1 ? "opción" : "opciones"}`) =>
  (value) => (Array.isArray(value) && value.length >= n ? null : message);

/**
 * Fecha ("YYYY-MM-DD") o fecha-hora ("YYYY-MM-DDTHH:mm") que no sea anterior a hoy / ahora.
 * `now` es inyectable para tests.
 */
export const notPast = (message = "La fecha no puede estar en el pasado", now = () => new Date()) =>
  (value) => {
    if (isEmpty(value)) return null;
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str < toLocalDateString(now()) ? message : null;
    const date = new Date(str);
    if (Number.isNaN(date.getTime())) return message;
    return date < now() ? message : null;
  };

/** Hora "HH:mm" estrictamente posterior a la de otro campo del mismo formulario. */
export const timeAfter = (otherField, message = "La hora de fin debe ser posterior a la de inicio") =>
  (value, form) => {
    const other = form?.[otherField];
    if (isEmpty(value) || isEmpty(other)) return null;
    return String(value) > String(other) ? null : message;
  };

/** Primer error de un campo según su lista de reglas, o null. */
export function validateField(form, schema, field) {
  for (const rule of schema[field] || []) {
    const message = rule(form?.[field], form);
    if (message) return message;
  }
  return null;
}

/** Valida todo el formulario. Devuelve { campo: mensaje } solo con los campos inválidos. */
export function validate(form, schema) {
  const errors = {};
  for (const field of Object.keys(schema)) {
    const message = validateField(form, schema, field);
    if (message) errors[field] = message;
  }
  return errors;
}

/** Para @keypress: impide escribir caracteres que no sean dígitos (Enter y atajos siguen funcionando). */
export function blockNonDigits(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key && event.key.length === 1 && !/\d/.test(event.key)) event.preventDefault();
}
