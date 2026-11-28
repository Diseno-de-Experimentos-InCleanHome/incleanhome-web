/**
 * Cliente API del área de atención (US32).
 * Capa: Profiles / infrastructure
 *
 * Endpoints: GET y PUT /workers/me/service-area
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const ServiceAreaApi = {
  async get() {
    const { data } = await apiClient.get("/workers/me/service-area");
    return data; // { district, radiusKm }
  },
  async save({ district, radiusKm }) {
    const { data } = await apiClient.put("/workers/me/service-area", { district, radiusKm });
    return data;
  },
};
