/**
 * Servicio de dominio: cálculo de precio referencial de una reserva.
 * Capa: Booking / domain / services
 *
 * La plataforma es solo intermediaria: el total es informativo,
 * el pago se coordina directamente entre cliente y trabajadora.
 */
export const BookingPricingService = {
  calculateTotal(hourlyRate, hours) {
    return hourlyRate * hours;
  },
};
