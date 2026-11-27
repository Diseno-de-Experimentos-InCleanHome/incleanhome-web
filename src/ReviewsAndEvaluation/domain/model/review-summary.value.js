/**
 * Value Object ReviewSummary — historial de reseñas verificadas de un prestador/a (US34).
 * Capa: ReviewsAndEvaluation / domain / model
 * Mapea GET /reviews/worker/:id/summary.
 */
const STARS = [5, 4, 3, 2, 1];

export class ReviewSummary {
  constructor({ workerId, verifiedReviewCount, distribution, completedServices }) {
    this.workerId            = workerId;
    this.verifiedReviewCount = verifiedReviewCount;
    this.distribution        = distribution;        // [{ stars, count }] de 5 a 1
    this.completedServices   = completedServices;
  }

  hasReviews() { return this.verifiedReviewCount > 0; }

  /**
   * Promedio con un decimal, redondeado como en la app móvil; null si no hay reseñas.
   * Sale de la distribución para no redondear dos veces el promedio que envía el API.
   */
  averageRating() {
    const count = this.distribution.reduce((total, row) => total + row.count, 0);
    if (!this.hasReviews() || count === 0) return null;
    const sum = this.distribution.reduce((total, row) => total + row.stars * row.count, 0);
    return Math.round((sum * 10) / count) / 10;
  }

  /** Porcentaje de reseñas con esa cantidad de estrellas, para las barras. */
  share(count) {
    return this.hasReviews() ? (count / this.verifiedReviewCount) * 100 : 0;
  }

  static fromApi(raw) {
    const byStars = new Map(Object.entries(raw.distribution ?? {}));
    return new ReviewSummary({
      workerId: raw.workerId,
      verifiedReviewCount: raw.verifiedReviewCount ?? 0,
      distribution: STARS.map((stars) => ({ stars, count: byStars.get(String(stars)) ?? 0 })),
      completedServices: raw.completedServices ?? 0,
    });
  }
}
