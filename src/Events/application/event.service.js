/**
 * Servicio de aplicación de eventos.
 * Capa: Events / application
 */
import { EventApi } from "../infrastructure/event.api.js";
import { Event } from "../domain/model/event.entity.js";

export const EventService = {
  async create(payload) {
    const raw = await EventApi.create(payload);
    return Event.fromApi(raw);
  },

  async searchOpen(filters = {}) {
    const raw = await EventApi.searchOpen(filters);
    return raw.map(Event.fromApi);
  },

  /** Client only — see EventApplicationService.listMine() for the worker's view. */
  async listMine() {
    const raw = await EventApi.listMine();
    return raw.map(Event.fromApi);
  },

  async getById(id) {
    const raw = await EventApi.getById(id);
    return Event.fromApi(raw);
  },

  async cancel(id) {
    const raw = await EventApi.cancel(id);
    return Event.fromApi(raw);
  },

  async complete(id) {
    const raw = await EventApi.complete(id);
    return Event.fromApi(raw);
  },
};
