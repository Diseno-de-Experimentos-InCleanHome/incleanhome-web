/**
 * Value Object WorkerStats — worker dashboard statistics.
 * Layer: Profiles / domain / model
 */
export class WorkerStats {
  constructor({ completedServices=0, averageRating=0, monthlyServiceCounts=[] }) {
    this.completedServices   = completedServices;
    this.averageRating       = averageRating;
    this.monthlyServiceCounts = monthlyServiceCounts;
  }

  static fromApi(raw) {
    return new WorkerStats({ ...raw });
  }

  static empty() { return new WorkerStats({}); }
}
