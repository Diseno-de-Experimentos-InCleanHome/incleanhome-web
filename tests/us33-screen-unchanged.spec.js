/**
 * US33 — sin EC-BLQ01 la reserva no cambia. La captura se generó antes de implementar la
 * historia. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { screenMarkup } from "./support/screen.js";

const route = { params: { id: "3" }, query: {} };
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

const get = vi.fn();
const post = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import { useAuthStore } from "../src/IAM/application/auth.store.js";
import { useExperimentStore } from "../src/Experiments/application/experiment.store.js";
import { TrackingStorage } from "../src/Tracking/infrastructure/tracking.storage.js";
import BookingView from "../src/Booking/presentation/views/BookingView.vue";

const worker = { id: 3, name: "Alex Prueba", serviceTypes: ["limpieza_general"], hourlyRate: 20 };

describe("US33 - Reserva sin cambios sin EC-BLQ01", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 27, 12, 0, 0));
    localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useAuthStore().updateUser({ id: 1, role: "client" });
    i18n.global.locale.value = "es";
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    ["sin experimentos", { experiments: [] }],
    ["apagado", { experiments: [{ id: "EC-BLQ01", enabled: false, treatmentPercent: 100 }] }],
    ["en control", { experiments: [{ id: "EC-BLQ01", enabled: true, treatmentPercent: 0 }] }],
  ])("testFlag_%s: misma pantalla, mismas peticiones y misma reserva", async (_, config) => {
    get.mockImplementation(async (url) => ({ data: url === "/experiments/config" ? config : worker }));
    post.mockResolvedValue({ data: { id: 9, serviceType: "limpieza_general", status: "pending", totalAmount: 40 } });
    await useExperimentStore().load(); // en la app lo pide main.js al iniciar
    const wrapper = mount(BookingView, { global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: true } } });
    await flushPromises();

    await expect(screenMarkup(wrapper)).toMatchFileSnapshot("./__snapshots__/us33-booking.html");

    await wrapper.findAll(".cal-day").find((day) => day.text() === "30").trigger("click");
    await wrapper.find('input[type="text"]').setValue("Av. Larco 123");
    await wrapper.find("button.btn-lg").trigger("click");
    await flushPromises();

    expect(get.mock.calls.map(([url]) => url).sort()).toEqual(["/experiments/config", "/workers/3"]);
    expect(post.mock.calls).toEqual([["/bookings", {
      workerId: 3, serviceType: "limpieza_general", date: "2026-11-30", startTime: "08:00", endTime: "10:00",
      hours: 2, address: "Av. Larco 123", notes: "",
    }]]);
    const created = TrackingStorage.getOutbox().find((e) => e.eventName === "booking_request_created");
    expect(Object.keys(created.properties)).not.toContain("origin");
  });
});
