/**
 * Cliente API de sugerencias (US33).
 * Capa: SearchAndCatalog / infrastructure
 *
 * Endpoint: GET /workers/suggestions?serviceType=&date=&startTime=&endTime=&district=
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const SuggestionApi = {
  async list({ serviceType, date, startTime, endTime, district }) {
    const params = { serviceType, date, startTime, endTime, district };
    const { data } = await apiClient.get("/workers/suggestions", { params });
    return data; // hasta 5 prestadores/as con approxDistanceKm, ya ordenados
  },
};
