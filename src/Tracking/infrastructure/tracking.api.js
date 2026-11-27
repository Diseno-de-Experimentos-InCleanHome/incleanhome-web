/**
 * Cliente API de tracking.
 * Capa: Tracking / infrastructure
 *
 * Endpoint: POST /tracking/events (con sesión). Responde 202; los eventos no válidos se
 * descartan en el servidor sin rechazar el lote. Idempotente por eventId.
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

const TIMEOUT_MS = 15000;

export const TrackingApi = {
  async sendEvents(events) {
    await apiClient.post("/tracking/events", { events }, { timeout: TIMEOUT_MS });
  },
};
