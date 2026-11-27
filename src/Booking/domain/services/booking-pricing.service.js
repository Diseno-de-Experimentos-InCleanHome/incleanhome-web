/**
 * Servicio de dominio: cálculo de duración y precio referencial de una reserva.
 * Capa: Booking / domain / services
 *
 * La plataforma es solo intermediaria: el total es informativo,
 * el pago se coordina directamente entre las partes.
 *
 * `hoursBetween` y `estimate` reproducen las reglas del API (US41) y de BookingEstimator de
 * la app móvil: la duración sale del horario con 2 decimales (100 minutos = 1.67 h), dura al
 * menos 30 minutos y el total se redondea al par en el medio céntimo (como Math.Round en .NET).
 */
export const MIN_BOOKING_HOURS = 0.5;

function minutesOf(time) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time ?? "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Horas entre dos "HH:mm" con 2 decimales; null si el fin no es posterior al inicio. */
function hoursBetween(startTime, endTime) {
  const start = minutesOf(startTime);
  const end = minutesOf(endTime);
  if (start === null || end === null || end <= start) return null;
  // Centésimas de hora redondeadas hacia arriba en el medio, en aritmética entera.
  return Math.floor(((end - start) * 200 + 60) / 120) / 100;
}

/** Total con 2 decimales calculado en enteros, sin errores de coma flotante. */
function roundedTotal(hourlyRate, hours) {
  const product = Math.round(hourlyRate * 100) * Math.round(hours * 100); // diezmilésimas
  let cents = Math.floor(product / 100);
  const rest = product % 100;
  if (rest > 50 || (rest === 50 && cents % 2 !== 0)) cents += 1;
  return cents / 100;
}

export const BookingPricingService = {
  calculateTotal(hourlyRate, hours) {
    return hourlyRate * hours;
  },

  hoursBetween,

  /** { hourlyRate, hours, totalAmount }, o null si la tarifa o el horario no son válidos. */
  estimate(hourlyRate, startTime, endTime) {
    const hours = hoursBetween(startTime, endTime);
    if (!(hourlyRate > 0) || hours === null || hours < MIN_BOOKING_HOURS) return null;
    return { hourlyRate, hours, totalAmount: roundedTotal(hourlyRate, hours) };
  },
};

/** Regla de formulario: el horario debe durar al menos 30 minutos. */
export const minimumDuration = (startField, message) => (endTime, form) => {
  const hours = hoursBetween(form?.[startField], endTime);
  return hours !== null && hours < MIN_BOOKING_HOURS ? message : null;
};
