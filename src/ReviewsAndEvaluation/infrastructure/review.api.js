/**
 * Cliente API de reseñas.
 * Capa: ReviewsAndEvaluation / infrastructure
 *
 * Endpoints: POST /reviews, GET /reviews/worker/:workerId
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const ReviewApi = {
  async create(payload) {
    const { data } = await apiClient.post("/reviews", payload);
    return data;
  },
  async listForWorker(workerId) {
    const { data } = await apiClient.get(`/reviews/worker/${workerId}`);
    return data;
  },
};
