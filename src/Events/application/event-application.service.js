/**
 * Servicio de aplicación de postulaciones a eventos.
 * Capa: Events / application
 */
import { EventApplicationApi } from "../infrastructure/event-application.api.js";
import { EventApi } from "../infrastructure/event.api.js";
import { EventApplication } from "../domain/model/event-application.entity.js";

/**
 * Las rutas del backend llevan la restricción `{appId:int}` / `{id:int}`: un id nulo o
 * vacío arma una URL que el router rechaza con un 404 poco descifrable. Lo cortamos aquí.
 */
function requireId(value, name) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    throw new Error(`${name} inválido`);
  }
}

export const EventApplicationService = {
  async apply(eventId, message) {
    requireId(eventId, "eventId");
    const raw = await EventApplicationApi.apply(eventId, message);
    return EventApplication.fromApi(raw);
  },

  async listByEvent(eventId) {
    const raw = await EventApplicationApi.listByEvent(eventId);
    return raw.map(EventApplication.fromApi);
  },

  /** Worker only — GET /events/mine resolves to applications for a worker caller. */
  async listMine() {
    const raw = await EventApi.listMine();
    return raw.map(EventApplication.fromApi);
  },

  async accept(eventId, appId) {
    requireId(eventId, "eventId");
    requireId(appId, "applicationId");
    const raw = await EventApplicationApi.accept(eventId, appId);
    return EventApplication.fromApi(raw);
  },

  async reject(eventId, appId) {
    requireId(eventId, "eventId");
    requireId(appId, "applicationId");
    const raw = await EventApplicationApi.reject(eventId, appId);
    return EventApplication.fromApi(raw);
  },

  async withdraw(eventId, appId) {
    requireId(eventId, "eventId");
    requireId(appId, "applicationId");
    const raw = await EventApplicationApi.withdraw(eventId, appId);
    return EventApplication.fromApi(raw);
  },
};
