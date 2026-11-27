/**
 * Composable useBookingEstimate — monto estimado que muestra el formulario de reserva (US41).
 * Capa: Booking / presentation / composables
 *
 * Calcula al instante con las reglas del dominio y, cuando ya hay fecha, pide el monto a
 * POST /bookings/estimate, que usa la tarifa vigente:
 *   - Respuesta correcta: se muestra la del API.
 *   - 400: se muestra el motivo y ningún monto.
 *   - Sin respuesta: se mantiene el cálculo local, que usa la misma fórmula.
 */
import { computed, ref, toValue, watch } from "vue";
import { BookingService } from "../../application/booking.service.js";
import { BookingPricingService } from "../../domain/services/booking-pricing.service.js";

/**
 * @param {object} source refs o getters: enabled, hourlyRate, request
 *   ({ workerId, serviceType, date, startTime, endTime })
 */
export function useBookingEstimate({ enabled, hourlyRate, request }) {
  const confirmed = ref(null);
  const error = ref("");
  let latest = 0;

  const local = computed(() => {
    const { startTime, endTime } = toValue(request);
    return BookingPricingService.estimate(toValue(hourlyRate), startTime, endTime);
  });

  // Se compara el contenido: la petición solo se repite si cambia algún dato.
  const key = computed(() => {
    const data = toValue(request);
    const ready = toValue(enabled) && local.value && data.date && data.serviceType;
    return ready ? JSON.stringify(data) : null;
  });

  watch(key, async (current) => {
    const query = ++latest;
    confirmed.value = null;
    error.value = "";
    if (!current) return;
    try {
      const response = await BookingService.estimate(JSON.parse(current));
      if (query === latest) confirmed.value = response;
    } catch (e) {
      if (query === latest && e.response?.status === 400) error.value = e.response.data?.error ?? "";
    }
  }, { immediate: true });

  const estimate = computed(() => (error.value ? null : confirmed.value ?? local.value));

  return { estimate, error };
}
