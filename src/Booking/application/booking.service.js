/**
 * Servicio de aplicación de reservas.
 * Capa: Booking / application
 *
 * Casos de uso: listar, crear, cambiar estado de una reserva.
 */
import { BookingApi } from "../infrastructure/booking.api.js";
import { Booking } from "../domain/model/booking.entity.js";

export const BookingService = {
  async list() {
    const raw = await BookingApi.list();
    return raw
      .map(Booking.fromApi)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async create(payload) {
    const raw = await BookingApi.create(payload);
    return Booking.fromApi(raw);
  },

  async updateStatus(id, status) {
    return BookingApi.updateStatus(id, status);
  },

  async cancel(id) {
    return BookingApi.updateStatus(id, "cancelled");
  },
};
