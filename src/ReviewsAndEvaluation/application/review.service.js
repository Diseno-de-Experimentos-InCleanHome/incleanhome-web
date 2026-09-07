/**
 * Servicio de aplicación de reseñas.
 * Capa: ReviewsAndEvaluation / application
 * Gestiona creación y consulta de reseñas por trabajador via ReviewApi.
 */
import { ReviewApi } from "../infrastructure/review.api.js";
import { Review } from "../domain/model/review.entity.js";

export const ReviewService = {
  async create({ bookingId, workerId, rating, comment }) {
    const raw = await ReviewApi.create({ bookingId, workerId, rating, comment });
    return raw;
  },

  async listForWorker(workerId) {
    const raw = await ReviewApi.listForWorker(workerId);
    return raw.map(Review.fromApi);
  },
};
