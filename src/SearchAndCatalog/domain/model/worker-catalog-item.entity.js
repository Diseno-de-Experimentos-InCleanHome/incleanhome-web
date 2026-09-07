/**
 * Entidad WorkerCatalogItem — trabajadora como aparece en el catálogo.
 * Capa: SearchAndCatalog / domain / model
 */
export class WorkerCatalogItem {
  constructor({ id, name, age, gender, bio, phone, serviceTypes, zones,
    hourlyRate, experienceYears, averageRating, totalServices }) {
    this.id                 = id;
    this.name               = name;
    this.age                = age;
    this.gender             = gender;
    this.bio                = bio;
    this.phone              = phone;
    this.serviceTypes       = serviceTypes || [];
    this.zones              = zones || [];
    this.hourlyRate         = hourlyRate;
    this.experienceYears    = experienceYears;
    this.averageRating      = averageRating;
    this.totalServices      = totalServices;
  }

  initials() {
    return (this.name || "W").split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
  }

  avatarColor(colors = ["#009960","#1A2E4A","#00B272","#3A4A5C","#f59e0b","#ef4444"]) {
    return colors[this.id % colors.length];
  }

  static fromApi(raw) {
    return new WorkerCatalogItem({ ...raw });
  }
}
