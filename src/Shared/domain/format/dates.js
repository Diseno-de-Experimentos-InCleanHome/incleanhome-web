/**
 * Formato de fechas según el idioma de la interfaz.
 * Capa: Shared / domain / format
 */
const REGIONS = new Map([["es", "es-PE"], ["en", "en-US"]]);

export const dateLocale = (locale) => REGIONS.get(locale) ?? "es-PE";

/**
 * "yyyy-MM-dd" como fecha local. `new Date("2026-10-03")` la tomaría como medianoche UTC y en
 * Perú mostraría el día anterior.
 */
export function dateFromIsoDay(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text ?? "");
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

export function formatLongDate(date, locale) {
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(dateLocale(locale), { year: "numeric", month: "long", day: "numeric" });
}
