/**
 * Entidad Event — evento con cupo para varias trabajadoras.
 * Capa: Events / domain / model
 */
import { EventStatus } from "./event-status.value.js";

export class Event {
  constructor({ id, clientId, clientName, title, description, serviceTypes, zone, address,
    date, startTime, endTime, hours, workersNeeded, acceptedCount, hourlyRateOffered,
    applicationDeadline, status, myApplicationStatus, createdAt }) {
    this.id = id;
    this.clientId = clientId;
    this.clientName = clientName;
    this.title = title;
    this.description = description;
    this.serviceTypes = serviceTypes || [];
    this.zone = zone;
    this.address = address;
    this.date = date;
    this.startTime = startTime;
    this.endTime = endTime;
    this.hours = hours;
    this.workersNeeded = workersNeeded;
    this.acceptedCount = acceptedCount;
    this.hourlyRateOffered = hourlyRateOffered;
    this.applicationDeadline = applicationDeadline;
    this.status = status;
    this.myApplicationStatus = myApplicationStatus;
    this.createdAt = createdAt;
  }

  isOpen()      { return this.status === EventStatus.OPEN; }
  isStaffed()   { return this.status === EventStatus.STAFFED; }
  isCompleted() { return this.status === EventStatus.COMPLETED; }
  isCancelled() { return this.status === EventStatus.CANCELLED; }
  spotsRemaining() { return Math.max(0, this.workersNeeded - this.acceptedCount); }
  deadlinePassed()  { return new Date(this.applicationDeadline) <= new Date(); }

  static fromApi(raw) {
    return new Event({ ...raw });
  }
}
