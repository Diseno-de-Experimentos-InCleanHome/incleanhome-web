/**
 * Entidad Review — reseña de un cliente sobre una trabajadora.
 * Capa: ReviewsAndEvaluation / domain / model
 * Incluye mapeo desde API (fromApi). Rating en escala 1-5.
 */
export class Review {
  constructor({ id, bookingId, workerId, clientId, clientName, rating, comment, createdAt }) {
    this.id         = id;
    this.bookingId  = bookingId;
    this.workerId   = workerId;
    this.clientId   = clientId;
    this.clientName = clientName;
    this.rating     = rating;     // 1–5
    this.comment    = comment;
    this.createdAt  = createdAt;
  }

  static fromApi(raw) {
    return new Review({ id:raw.id, bookingId:raw.bookingId, workerId:raw.workerId,
      clientId:raw.clientId, clientName:raw.clientName,
      rating:raw.rating, comment:raw.comment, createdAt:raw.createdAt });
  }
}
