/**
 * Plan de tracking 8.2.8 (US42).
 * Capa: Tracking / domain / model
 *
 * Eventos que la web conoce y propiedades que cada uno puede conservar; cualquier otra se
 * descarta antes de guardar el evento. Es el subconjunto web del catálogo del API y de
 * TrackingPlan.kt de la app móvil.
 *
 * El API registra por su cuenta la reserva creada o fallida, el cambio de estado, la reseña,
 * la disponibilidad y el mensaje. De esos, la web solo envía (con capturedBy "client") la
 * reserva creada o fallida y la reseña, para conciliarlos con los del servidor.
 */
export const PLATFORM = "web";
export const CAPTURED_BY_CLIENT = "client";

export const TrackingEventName = Object.freeze({
  WORKER_SEARCH_PERFORMED: "worker_search_performed",
  WORKER_PROFILE_VIEWED: "worker_profile_viewed",
  WORKER_REVIEWS_VIEWED: "worker_reviews_viewed",
  AVAILABILITY_UPDATED: "availability_updated",
  BOOKING_FORM_OPENED: "booking_form_opened",
  BOOKING_ESTIMATE_VIEWED: "booking_estimate_viewed",
  BOOKING_REQUEST_CREATED: "booking_request_created",
  BOOKING_REQUEST_FAILED: "booking_request_failed",
  BOOKING_STATUS_CHANGED: "booking_status_changed",
  MESSAGE_SENT: "message_sent",
  REVIEW_SUBMITTED: "review_submitted",
  FAQ_VIEWED: "faq_viewed",
  FAQ_RESOLVED: "faq_resolved",
  EXPERIMENT_EXPOSURE: "experiment_exposure",
});

const E = TrackingEventName;

const ALLOWED_PROPERTIES = new Map([
  [E.WORKER_SEARCH_PERFORMED,
    ["serviceCategory", "filtersApplied", "resultsCount", "searchId", "searchMode", "district"]],
  [E.WORKER_PROFILE_VIEWED, ["workerId", "platform", "source", "searchId"]],
  [E.WORKER_REVIEWS_VIEWED, ["workerId", "reviewCount", "verifiedCount"]],
  [E.AVAILABILITY_UPDATED, ["workerId", "updatedDaysCount", "capturedBy"]],
  [E.BOOKING_FORM_OPENED, ["workerId", "platform", "formId", "searchId", "origin"]],
  [E.BOOKING_ESTIMATE_VIEWED, ["formId", "estimatedAmount"]],
  [E.BOOKING_REQUEST_CREATED,
    ["bookingId", "serviceCategory", "status", "formId", "searchId", "origin", "estimatedAmount",
      "registeredAmount", "amountMatches", "capturedBy"]],
  [E.BOOKING_REQUEST_FAILED, ["errorType", "platform", "formId", "capturedBy"]],
  [E.BOOKING_STATUS_CHANGED, ["bookingId", "previousStatus", "newStatus", "capturedBy"]],
  [E.MESSAGE_SENT, ["conversationId", "userRole", "capturedBy"]],
  [E.REVIEW_SUBMITTED, ["bookingId", "rating", "source", "isVerified", "capturedBy"]],
  [E.FAQ_VIEWED, ["category", "faqId"]],
  [E.FAQ_RESOLVED, ["category", "faqId"]],
  [E.EXPERIMENT_EXPOSURE, ["location"]],
]);

/** Forma que debe tener el valor de cada propiedad (las mismas reglas que aplica el API). */
export const PROPERTY_KINDS = new Map([
  ["workerId", "integer"], ["bookingId", "integer"], ["resultsCount", "integer"],
  ["reviewCount", "integer"], ["verifiedCount", "integer"], ["updatedDaysCount", "integer"],
  ["rating", "integer"],
  ["estimatedAmount", "number"], ["registeredAmount", "number"],
  ["amountMatches", "boolean"], ["isVerified", "boolean"],
  ["formId", "identifier"], ["searchId", "identifier"], ["conversationId", "identifier"],
  ["faqId", "identifier"],
  ["errorType", "code"], ["status", "code"], ["previousStatus", "code"], ["newStatus", "code"],
  ["source", "code"], ["origin", "code"], ["searchMode", "code"], ["category", "code"],
  ["location", "code"],
  ["serviceCategory", "label"], ["district", "label"],
  ["filtersApplied", "filters"],
  ["platform", "platform"], ["userRole", "role"], ["capturedBy", "capturedBy"],
]);

/** Propiedades permitidas del evento, o null si el evento no está en el plan. */
export function allowedProperties(eventName) {
  return ALLOWED_PROPERTIES.get(eventName) ?? null;
}
