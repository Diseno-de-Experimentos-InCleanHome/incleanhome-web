/**
 * EventDetailWorkerView — the screen where a worker applies to / withdraws from an event.
 * Reproduces "las postulaciones arrojan error".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const route = { params: { id: "5" } };
vi.mock("vue-router", () => ({ useRoute: () => route }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (k) => k }) }));

const getById = vi.fn();
const apply = vi.fn();
const withdraw = vi.fn();
const listMine = vi.fn();

vi.mock("../src/Events/application/event.service.js", () => ({
  EventService: { getById: (...a) => getById(...a) },
}));
vi.mock("../src/Events/application/event-application.service.js", () => ({
  EventApplicationService: {
    apply: (...a) => apply(...a),
    withdraw: (...a) => withdraw(...a),
    listMine: (...a) => listMine(...a),
  },
}));

import EventDetailWorkerView from "../src/Events/presentation/views/EventDetailWorkerView.vue";
import { Event } from "../src/Events/domain/model/event.entity.js";
import { EventApplication } from "../src/Events/domain/model/event-application.entity.js";

const baseEvent = {
  id: 5,
  clientId: 1,
  clientName: "Ana",
  title: "Limpieza post evento",
  description: "Fiesta de promocion",
  serviceTypes: ["deep"],
  zone: "miraflores",
  address: "Av. Larco 123",
  date: "2026-09-20",
  startTime: "09:00",
  endTime: "15:00",
  hours: 6,
  workersNeeded: 3,
  acceptedCount: 1,
  hourlyRateOffered: 25,
  applicationDeadline: "2099-01-01T00:00:00.0000000Z",
  status: "open",
  myApplicationStatus: null,
  createdAt: "2026-09-08T15:00:00+00:00",
};

async function mountView(overrides = {}) {
  setActivePinia(createPinia());
  getById.mockResolvedValue(Event.fromApi({ ...baseEvent, ...overrides }));
  const wrapper = mount(EventDetailWorkerView, { global: { stubs: { AppIcon: true } } });
  await flushPromises();
  return wrapper;
}

beforeEach(() => vi.clearAllMocks());

describe("EventDetailWorkerView — applying", () => {
  it("shows the apply form for an open event the worker has not applied to", async () => {
    const w = await mountView();
    expect(w.find(".apply-card").exists()).toBe(true);
    expect(w.find("textarea").exists()).toBe(true);
  });

  it("applies with the event id and the typed message", async () => {
    const w = await mountView();
    apply.mockResolvedValue(EventApplication.fromApi({ id: 33, eventId: 5, status: "pending" }));
    getById.mockResolvedValue(Event.fromApi({ ...baseEvent, myApplicationStatus: "pending" }));
    listMine.mockResolvedValue([EventApplication.fromApi({ id: 33, eventId: 5, status: "pending" })]);

    await w.find("textarea").setValue("Tengo experiencia");
    await w.find(".apply-card button").trigger("click");
    await flushPromises();

    expect(apply).toHaveBeenCalledWith(5, "Tengo experiencia");
  });

  it("surfaces the backend message when the application is refused", async () => {
    const w = await mountView();
    apply.mockRejectedValue({
      response: { data: { error: "The application deadline has passed." } },
    });

    await w.find(".apply-card button").trigger("click");
    await flushPromises();

    expect(w.find(".error-box").text()).toBe("The application deadline has passed.");
  });

  it("hides the apply form once the deadline has passed", async () => {
    const w = await mountView({ applicationDeadline: "2000-01-01T00:00:00.0000000Z" });
    expect(w.find(".apply-card").exists()).toBe(false);
    expect(w.find(".empty-state").exists()).toBe(true);
  });

  it("hides the apply form for a cancelled event", async () => {
    const w = await mountView({ status: "cancelled" });
    expect(w.find(".apply-card").exists()).toBe(false);
  });
});

describe("EventDetailWorkerView — withdrawing", () => {
  it("withdraws using the application id resolved from my applications", async () => {
    listMine.mockResolvedValue([
      EventApplication.fromApi({ id: 99, eventId: 7, status: "pending" }),
      EventApplication.fromApi({ id: 33, eventId: 5, status: "pending" }),
    ]);
    const w = await mountView({ myApplicationStatus: "pending" });
    withdraw.mockResolvedValue(EventApplication.fromApi({ id: 33, eventId: 5, status: "withdrawn" }));

    await w.find(".status-card button").trigger("click");
    await flushPromises();

    expect(withdraw).toHaveBeenCalledWith(5, 33);
  });

  it("does not fire a withdraw with a null id when the lookup misses", async () => {
    // GET /events/mine can legitimately not contain the row (paging, race, stale cache).
    // Sending null builds /events/5/applications/null/withdraw, which the {appId:int}
    // route constraint answers with 404.
    listMine.mockResolvedValue([]);
    const w = await mountView({ myApplicationStatus: "pending" });

    await w.find(".status-card button").trigger("click");
    await flushPromises();

    expect(withdraw).not.toHaveBeenCalled();
  });
});
