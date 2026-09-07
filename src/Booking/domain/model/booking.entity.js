/**
 * Entidad Booking — reserva de servicio.
 * Capa: Booking / domain / model
 */
import { BookingStatus } from "./booking-status.value.js";

export class Booking {
  constructor({ id, workerId, workerName, clientId, clientName, serviceType,
    date, startTime, endTime, hours, address, notes,
    totalAmount, status, hasReview, createdAt }) {
    this.id = id;
    this.workerId = workerId;
    this.workerName = workerName;
    this.clientId = clientId;
    this.clientName = clientName;
    this.serviceType = serviceType;
    this.date = date;
    this.startTime = startTime;
    this.endTime = endTime;
    this.hours = hours;
    this.address = address;
    this.notes = notes;
    this.totalAmount = totalAmount;
    this.status = status;
    this.hasReview = hasReview;
    this.createdAt = createdAt;
  }

  isPending()   { return this.status === BookingStatus.PENDING; }
  isAccepted()  { return this.status === BookingStatus.ACCEPTED; }
  isCompleted() { return this.status === BookingStatus.COMPLETED; }
  canBeCancelled() { return this.isPending(); }

  static fromApi(raw) {
    return new Booking({ ...raw });
  }
}
