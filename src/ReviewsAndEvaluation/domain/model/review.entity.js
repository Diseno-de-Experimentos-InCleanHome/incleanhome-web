/**
 * Entidad Review — reseña de un cliente sobre un prestador/a.
 * Capa: ReviewsAndEvaluation / domain / model
 * Incluye mapeo desde API (fromApi). Rating en escala 1-5.
 */

/** El API exige un comentario de 1 a 1000 caracteres. */
export const REVIEW_COMMENT_MAX = 1000;

export class Review {
  constructor({ id, bookingId, workerId, clientId, clientName, rating, comment, createdAt,
    serviceType = null, serviceDate = null, isVerified = false }) {
    this.id          = id;
    this.bookingId   = bookingId;
    this.workerId    = workerId;
    this.clientId    = clientId;
    this.clientName  = clientName;
    this.rating      = rating;      // 1–5
    this.comment     = comment;
    this.createdAt   = createdAt;
    this.serviceType = serviceType; // servicio de la reserva
    this.serviceDate = serviceDate; // "yyyy-MM-dd"
    this.isVerified  = isVerified;  // proviene de una reserva completada (US34)
  }

  static fromApi(raw) {
    return new Review({ id:raw.id, bookingId:raw.bookingId, workerId:raw.workerId,
      clientId:raw.clientId, clientName:raw.clientName,
      rating:raw.rating, comment:raw.comment, createdAt:raw.createdAt,
      serviceType:raw.serviceType ?? null, serviceDate:raw.serviceDate ?? null,
      isVerified:raw.isVerified === true });
  }
}
