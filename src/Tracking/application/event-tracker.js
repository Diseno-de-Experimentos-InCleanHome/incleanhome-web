/**
 * Registro y envío de eventos (US42).
 * Capa: Tracking / application
 *
 * Los eventos se guardan en una cola local y se envían en lotes cuando hay sesión:
 *   - 202: se eliminan de la cola.
 *   - 400: el lote nunca será aceptado, así que se descarta para no bloquear la cola.
 *   - 401: se conservan hasta que haya una sesión nueva.
 *   - 503, otros errores o sin red: se conservan y se reintenta con espera creciente.
 * Una misma operación (misma clave) no se registra dos veces y siempre produce el mismo
 * eventId, para que el API también la descarte si se reenvía.
 */
import { createTrackingEvent, idForOperation, newId } from "../domain/model/tracking-event.entity.js";
import { allowedProperties } from "../domain/model/tracking-plan.js";

export const TrackResult = Object.freeze({ RECORDED: "recorded", DUPLICATE: "duplicate", REJECTED: "rejected" });

export const MAX_OUTBOX = 1000;
const MAX_KEYS = 2000;
const BATCH_SIZE = 100;
/** Margen para agrupar en un solo envío los eventos de una misma pantalla. */
export const FLUSH_DELAY_MS = 2000;
export const RETRY_DELAYS_MS = Object.freeze([5000, 15000, 60000, 300000]);

export class EventTracker {
  constructor({ storage, api, getToken, environment }) {
    this.storage = storage;
    this.api = api;
    this.getToken = getToken;
    this.environment = environment;
    this.sessionId = newId();
    this.failures = 0;
    this.sending = null;
    this.flushTimer = null;
    this.retryTimer = null;
  }

  record({ eventName, properties, user, assignment, operationKey, occurredAt }) {
    if (!allowedProperties(eventName)) return TrackResult.REJECTED;

    const dedupeKey = operationKey == null ? null : `${eventName}|${user?.id ?? "anon"}|${operationKey}`;
    if (dedupeKey) {
      const keys = this.storage.getOperationKeys();
      if (keys.includes(dedupeKey)) return TrackResult.DUPLICATE;
      this.storage.setOperationKeys([...keys, dedupeKey].slice(-MAX_KEYS));
    }

    const event = createTrackingEvent({
      eventId: dedupeKey ? idForOperation(dedupeKey) : newId(),
      eventName,
      occurredAt: occurredAt ?? new Date().toISOString(),
      user,
      sessionId: this.sessionId,
      environment: this.environment,
      assignment,
      properties,
    });
    this.storage.setOutbox([...this.storage.getOutbox(), event].slice(-MAX_OUTBOX));
    this.scheduleFlush();
    return TrackResult.RECORDED;
  }

  scheduleFlush() {
    // Mientras hay un reintento pendiente no se insiste antes de tiempo.
    if (this.flushTimer || this.retryTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, FLUSH_DELAY_MS);
  }

  /** Envía la cola. Nunca falla; devuelve cuántos eventos confirmó el API. */
  flush() {
    this.sending ??= this.send().finally(() => { this.sending = null; });
    return this.sending;
  }

  cancelTimers() {
    clearTimeout(this.flushTimer);
    clearTimeout(this.retryTimer);
    this.flushTimer = null;
    this.retryTimer = null;
  }

  async send() {
    this.cancelTimers(); // este envío cubre lo que estuviera programado
    let confirmed = 0;

    while (this.getToken()) {
      const batch = this.storage.getOutbox().slice(0, BATCH_SIZE);
      if (batch.length === 0) break;
      try {
        await this.api.sendEvents(batch);
        confirmed += batch.length;
        this.failures = 0;
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) break;
        if (status !== 400) {
          this.scheduleRetry();
          break;
        }
      }
      this.remove(batch);
    }
    return confirmed;
  }

  remove(batch) {
    const ids = new Set(batch.map((event) => event.eventId));
    this.storage.setOutbox(this.storage.getOutbox().filter((event) => !ids.has(event.eventId)));
  }

  scheduleRetry() {
    this.cancelTimers(); // un envío agrupado no debe adelantarse al reintento
    const delay = RETRY_DELAYS_MS[Math.min(this.failures, RETRY_DELAYS_MS.length - 1)];
    this.failures += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.flush();
    }, delay);
  }
}
