/**
 * Employee profile application service.
 * Layer: Profiles / application
 */
import { ProfileApi } from "../infrastructure/profile.api.js";
import { WorkerProfile } from "../domain/model/worker-profile.entity.js";
import { WorkerStats } from "../domain/model/worker-stats.value.js";

export const WorkerProfileService = {
  async getProfile() {
    const raw = await ProfileApi.getWorkerProfile();
    return WorkerProfile.fromApi(raw);
  },

  async updateProfile(data) {
    return ProfileApi.updateWorkerProfile(data);
  },

  async getStats() {
    const raw = await ProfileApi.getWorkerStats();
    return WorkerStats.fromApi(raw);
  },
};
