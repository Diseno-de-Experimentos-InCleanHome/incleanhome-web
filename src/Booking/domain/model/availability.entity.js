/**
 * Entidad Availability — franja horaria semanal de una trabajadora.
 * Capa: Booking / domain / model
 */
export class Availability {
  constructor({ dayOfWeek, startTime, endTime, isAvailable }) {
    this.dayOfWeek = dayOfWeek;   // 0=Dom … 6=Sáb
    this.startTime = startTime;
    this.endTime   = endTime;
    this.isAvailable = isAvailable;
  }

  static defaultWeek() {
    return Array.from({ length: 7 }, (_, i) => new Availability({
      dayOfWeek: i,
      startTime: "08:00",
      endTime:   "18:00",
      isAvailable: i >= 1 && i <= 5,
    }));
  }

  static fromApi(raw) {
    return new Availability({ ...raw });
  }
}
