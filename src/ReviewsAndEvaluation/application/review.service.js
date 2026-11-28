/**
 * Servicio de aplicación de reseñas.
 * Capa: ReviewsAndEvaluation / application
 * Gestiona creación y consulta de reseñas por prestador/a via ReviewApi.
 */
import { ReviewApi } from "../infrastructure/review.api.js";
import { Review } from "../domain/model/review.entity.js";
import { ReviewSummary } from "../domain/model/review-summary.value.js";

export const ReviewSort = Object.freeze({ NEWEST: "newest", OLDEST: "oldest" });

export const ReviewService = {
  /** `source` opcional (US35): "reminder" o "direct", según de dónde viene la reseña. */
  async create({ bookingId, workerId, rating, comment, source }) {
    const raw = await ReviewApi.create({ bookingId, workerId, rating, comment, ...(source && { source }) });
    return raw;
  },

  /** `query` opcional: { sort: "newest" | "oldest", serviceType }. */
  async listForWorker(workerId, query) {
    const raw = await ReviewApi.listForWorker(workerId, query);
    return raw.map(Review.fromApi);
  },

  async getSummary(workerId) {
    const raw = await ReviewApi.getSummary(workerId);
    return ReviewSummary.fromApi(raw);
  },
};
