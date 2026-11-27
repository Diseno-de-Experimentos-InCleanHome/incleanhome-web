/**
 * Cliente API de reseñas.
 * Capa: ReviewsAndEvaluation / infrastructure
 *
 * Endpoints: POST /reviews, GET /reviews/worker/:workerId?sort=&serviceType=,
 * GET /reviews/worker/:workerId/summary
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const ReviewApi = {
  async create(payload) {
    const { data } = await apiClient.post("/reviews", payload);
    return data;
  },
  async listForWorker(workerId, { sort, serviceType } = {}) {
    // axios omite los parámetros sin valor.
    const params = { sort, serviceType: serviceType || undefined };
    const { data } = await apiClient.get(`/reviews/worker/${workerId}`, { params });
    return data;
  },
  async getSummary(workerId) {
    const { data } = await apiClient.get(`/reviews/worker/${workerId}/summary`);
    return data; // { workerId, verifiedReviewCount, averageRating, distribution, completedServices, message }
  },
};
