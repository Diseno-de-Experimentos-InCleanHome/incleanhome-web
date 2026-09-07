/**
 * WorkerProfile Entity — editable profile of a worker.
 * Layer: Profiles / domain / model
 */
export class WorkerProfile {
  constructor({ name, phone, age, experienceYears, hourlyRate,
    serviceTypes, zones, bio }) {
    this.name            = name;
    this.phone           = phone;
    this.age             = age;
    this.experienceYears = experienceYears;
    this.hourlyRate      = hourlyRate;
    this.serviceTypes    = serviceTypes || [];
    this.zones           = zones || [];
    this.bio             = bio;
  }

  initials() {
    return (this.name || "W").split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
  }

  static empty() {
    return new WorkerProfile({ name:"", phone:"", age:25, experienceYears:1,
      hourlyRate:25, serviceTypes:[], zones:[], bio:"" });
  }

  static fromApi(raw) {
    return new WorkerProfile({
      name: raw.name || "", phone: raw.phone || "",
      age: raw.age || 25, experienceYears: raw.experienceYears || 1,
      hourlyRate: raw.hourlyRate || 25,
      serviceTypes: raw.serviceTypes || [], zones: raw.zones || [],
      bio: raw.bio || "",
    });
  }
}
