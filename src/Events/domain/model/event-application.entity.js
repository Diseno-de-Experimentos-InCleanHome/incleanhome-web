/**
 * Entidad EventApplication — postulación de una trabajadora a un evento.
 * Capa: Events / domain / model
 */
import { ApplicationStatus } from "./application-status.value.js";

export class EventApplication {
  constructor({ id, eventId, eventTitle, eventDate, eventZone, eventStatus,
    workerId, workerName, message, status, createdAt }) {
    this.id = id;
    this.eventId = eventId;
    this.eventTitle = eventTitle;
    this.eventDate = eventDate;
    this.eventZone = eventZone;
    this.eventStatus = eventStatus;
    this.workerId = workerId;
    this.workerName = workerName;
    this.message = message;
    this.status = status;
    this.createdAt = createdAt;
  }

  isPending()   { return this.status === ApplicationStatus.PENDING; }
  isAccepted()  { return this.status === ApplicationStatus.ACCEPTED; }
  isRejected()  { return this.status === ApplicationStatus.REJECTED; }
  isWithdrawn() { return this.status === ApplicationStatus.WITHDRAWN; }

  static fromApi(raw) {
    return new EventApplication({ ...raw });
  }
}
