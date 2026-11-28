/**
 * US35 — sin EC-BLQ03, "Mis reservas" no cambia aunque la dirección traiga el enlace de un
 * recordatorio. Las capturas se generaron antes de implementar la historia. El API se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { screenMarkup } from "./support/screen.js";

const route = { path: "/client/bookings", params: {}, query: { reviewBookingId: "7", source: "reminder" } };
const push = vi.fn();
const replace = vi.fn();
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push, replace }) }));

const get = vi.fn();
const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { useExperimentStore } from "../src/Experiments/application/experiment.store.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import ClientBookingsView from "../src/Booking/presentation/views/ClientBookingsView.vue";

const booking = {
  id: 7, workerId: 3, workerName: "Alex Prueba", serviceType: "limpieza_general", date: "2026-11-25",
  startTime: "08:00", endTime: "10:00", address: "Av. Larco 123", totalAmount: 40, status: "completed",
  hasReview: false, createdAt: "2026-11-20T10:00:00Z",
};

describe("US35 - Reservas sin cambios sin EC-BLQ03", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useAuthStore().updateUser({ id: 1, role: "client" });
    i18n.global.locale.value = "es";
  });

  it.each([
    ["sin experimentos", { experiments: [] }],
    ["apagado", { experiments: [{ id: "EC-BLQ03", enabled: false, treatmentPercent: 100 }] }],
    ["en control", { experiments: [{ id: "EC-BLQ03", enabled: true, treatmentPercent: 0 }] }],
  ])("testFlag_%s: misma pantalla, mismas peticiones y misma reseña", async (_, config) => {
    get.mockImplementation(async (url) => ({ data: url === "/experiments/config" ? config : [booking] }));
    post.mockResolvedValue({ data: { id: 1, rating: 5, isVerified: true } });
    await useExperimentStore().load(); // en la app lo pide main.js al iniciar
    const wrapper = mount(ClientBookingsView, { global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: true } } });
    await flushPromises();

    await expect(screenMarkup(wrapper)).toMatchFileSnapshot("./__snapshots__/us35-bookings.html");

    await wrapper.find(".action-buttons button").trigger("click");
    await expect(screenMarkup(wrapper)).toMatchFileSnapshot("./__snapshots__/us35-bookings-review.html");

    await wrapper.findAll(".rating-btn")[4].trigger("click");
    await wrapper.find("textarea").setValue("Muy bien");
    await wrapper.find(".modal-actions .btn-primary").trigger("click");
    await flushPromises();

    expect(get.mock.calls.map(([url]) => url).sort())
      .toEqual(["/bookings", "/bookings", "/experiments/config"]);
    expect(post.mock.calls).toEqual([["/reviews", { bookingId: 7, workerId: 3, rating: 5, comment: "Muy bien" }]]);
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    const submitted = TrackingStorage.getOutbox().find((e) => e.eventName === "review_submitted");
    expect(submitted.properties.source).toBe("direct");
  });
});
