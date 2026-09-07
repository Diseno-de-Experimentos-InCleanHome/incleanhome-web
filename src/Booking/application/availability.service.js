/**
 * Servicio de aplicación de disponibilidad.
 * Capa: Booking / application
 */
import { AvailabilityApi } from "../infrastructure/availability.api.js";
import { Availability } from "../domain/model/availability.entity.js";

export const AvailabilityService = {
  async get(workerId) {
    const raw = await AvailabilityApi.get(workerId);
    if (!raw || raw.length === 0) return Availability.defaultWeek();
    const defaults = Availability.defaultWeek();
    raw.forEach(s => {
      if (s.dayOfWeek >= 0 && s.dayOfWeek <= 6) {
        defaults[s.dayOfWeek] = Availability.fromApi(s);
      }
    });
    return defaults;
  },

  async save(workerId, slots) {
    return AvailabilityApi.save(workerId, slots);
  },
};
