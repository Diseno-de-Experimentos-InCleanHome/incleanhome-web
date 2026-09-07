/**
 * Value Object SearchFilters — filtros de búsqueda de trabajadoras.
 * Capa: SearchAndCatalog / domain / model
 */
export class SearchFilters {
  constructor({ serviceType="", zone="", gender="", minAge="", maxAge="", maxHourlyRate="", minRating="" } = {}) {
    this.serviceType   = serviceType;
    this.zone          = zone;
    this.gender        = gender;
    this.minAge        = minAge;
    this.maxAge        = maxAge;
    this.maxHourlyRate = maxHourlyRate;
    this.minRating     = minRating;
  }

  /** Devuelve solo los filtros con valor para mandarlos como query params. */
  toParams() {
    const params = {};
    Object.entries(this).forEach(([k, v]) => { if (v !== "" && v !== null) params[k] = v; });
    return params;
  }

  isEmpty() {
    return Object.values(this).every(v => v === "");
  }

  static empty() { return new SearchFilters(); }
}
