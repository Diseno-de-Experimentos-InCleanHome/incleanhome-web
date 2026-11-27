/**
 * Formato de moneda de la plataforma: "S/ 0.00".
 * Capa: Shared / domain / format
 */
export function formatCurrency(amount) {
  const value = typeof amount === "string" && amount.trim() === "" ? Number.NaN : Number(amount ?? Number.NaN);
  return Number.isFinite(value) ? `S/ ${value.toFixed(2)}` : "—";
}
