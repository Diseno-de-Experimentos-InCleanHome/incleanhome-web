/**
 * Cliente API de experimentos.
 * Capa: Experiments / infrastructure
 *
 * Endpoint: GET /experiments/config (público, con o sin sesión).
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

const TIMEOUT_MS = 10000;

export const ExperimentApi = {
  async getConfig() {
    const { data } = await apiClient.get("/experiments/config", { timeout: TIMEOUT_MS });
    return data; // { experiments: [{ id, enabled, treatmentPercent }] }
  },
};
