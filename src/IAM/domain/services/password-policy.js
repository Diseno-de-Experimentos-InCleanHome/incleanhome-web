/**
 * Política de contraseñas del API (US40).
 * Capa: IAM / domain / services
 *
 * Repite las reglas del servidor para avisar antes de enviar; el servidor sigue decidiendo.
 */
export const PASSWORD_MIN_LENGTH = 12;
/** El servidor mide el máximo en bytes UTF-8. */
export const PASSWORD_MAX_BYTES = 72;

const FORBIDDEN = [
  "password", "passw0rd", "contraseña", "contrasena", "qwerty", "asdfgh", "letmein",
  "welcome", "bienvenid", "admin", "incleanhome", "123456", "654321", "abcdef", "iloveyou",
];

function containsEmailName(lowered, email) {
  const name = String(email ?? "").split("@")[0].trim().toLowerCase();
  return name.length >= 3 && lowered.includes(name);
}

const RULES = [
  ["minLength", (p) => p.length < PASSWORD_MIN_LENGTH],
  ["maxLength", (p) => new TextEncoder().encode(p).length > PASSWORD_MAX_BYTES],
  ["spaces", (p) => /\s/u.test(p)],
  ["lowercase", (p) => !/\p{Ll}/u.test(p)],
  ["uppercase", (p) => !/\p{Lu}/u.test(p)],
  ["digit", (p) => !/\p{Nd}/u.test(p)],
  ["symbol", (p) => !/[^\p{L}\p{Nd}\s]/u.test(p)],
  ["repeated", (p) => /(.)\1\1/u.test(p)],
  ["common", (p) => FORBIDDEN.some((word) => p.toLowerCase().includes(word))],
  ["email", (p, email) => containsEmailName(p.toLowerCase(), email)],
];

/** Códigos de las reglas que la contraseña no cumple; vacío si es aceptable. */
export function passwordProblems(password, email) {
  return RULES.filter(([, fails]) => fails(String(password ?? ""), email)).map(([code]) => code);
}
