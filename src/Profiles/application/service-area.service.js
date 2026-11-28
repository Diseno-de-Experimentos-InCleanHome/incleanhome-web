/**
 * Servicio de aplicación del área de atención (US32).
 * Capa: Profiles / application
 */
import { ServiceAreaApi } from "../infrastructure/service-area.api.js";

export const ServiceAreaStatus = Object.freeze({
  SAVED: "saved",
  EMPTY: "empty",
  /** El API responde 403: la funcionalidad no está activa para esta cuenta. */
  UNAVAILABLE: "unavailable",
});

export const ServiceAreaService = {
  /** @returns {Promise<{status: string, area: {district: string, radiusKm: number}|null}>} */
  async load() {
    try {
      return { status: ServiceAreaStatus.SAVED, area: await ServiceAreaApi.get() };
    } catch (error) {
      const status = error?.response?.status;
      if (status === 404) return { status: ServiceAreaStatus.EMPTY, area: null };
      if (status === 403) return { status: ServiceAreaStatus.UNAVAILABLE, area: null };
      throw error;
    }
  },

  save: (area) => ServiceAreaApi.save(area),
};
