/**
 * Profiles API Client
 * Layer: Profiles / infrastructure
 *
 * Endpoints:
 *   GET  /workers/me/profile      — employee profile
 *   PUT  /workers/me/profile
 *   GET  /workers/me/stats        — employee statistics
 *   GET  /my-profile              — client profile
 *   PATCH /my-profile             — update client profile
 */
import apiClient from "../../Shared/infrastructure/http/api.client.js";

export const ProfileApi = {
  async getWorkerProfile()     { const { data } = await apiClient.get("/workers/me/profile"); return data; },
  async updateWorkerProfile(p) { const { data } = await apiClient.put("/workers/me/profile", p); return data; },
  async getWorkerStats()       { const { data } = await apiClient.get("/workers/me/stats"); return data; },
  async getClientProfile()     { const { data } = await apiClient.get("/my-profile"); return data; },
  async updateClientProfile(p) { const { data } = await apiClient.patch("/my-profile", p); return data; },
};
