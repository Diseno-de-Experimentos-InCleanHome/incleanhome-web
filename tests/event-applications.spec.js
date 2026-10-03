/**
 * Events — postulaciones (worker applications), frontend side.
 *
 * The axios client is stubbed at the module boundary so the tests exercise the real
 * api -> service -> entity chain and the real URLs that reach the backend.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();

vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: {
    get: (...a) => get(...a),
    post: (...a) => post(...a),
    patch: (...a) => patch(...a),
    defaults: { headers: { common: {} } },
    interceptors: { request: { use: () => {} } },
  },
}));

import { EventApplicationService } from "../src/Events/application/event-application.service.js";
import { EventService } from "../src/Events/application/event.service.js";
import { ApplicationStatus } from "../src/Events/domain/model/application-status.value.js";

/** EventApplicationResource as the backend serialises it. */
const rawApplication = {
  id: 33,
  eventId: 5,
  eventTitle: "Limpieza post evento",
  eventDate: "2026-09-20",
  eventZone: "miraflores",
  eventStatus: "open",
  workerId: 2,
  workerName: "Maria",
  message: "Tengo experiencia",
  status: "pending",
  createdAt: "2026-09-08T15:00:00+00:00",
};

beforeEach(() => vi.clearAllMocks());

describe("EventApplicationService.apply", () => {
  it("posts the message to the event applications endpoint", async () => {
    post.mockResolvedValue({ data: rawApplication });

    const app = await EventApplicationService.apply(5, "Tengo experiencia");

    expect(post).toHaveBeenCalledWith("/events/5/applications", { message: "Tengo experiencia" });
    expect(app.id).toBe(33);
    expect(app.status).toBe(ApplicationStatus.PENDING);
    expect(app.isPending()).toBe(true);
  });

  it("keeps the embedded event summary the listings render", async () => {
    post.mockResolvedValue({ data: rawApplication });

    const app = await EventApplicationService.apply(5, null);

    expect(app.eventTitle).toBe("Limpieza post evento");
    expect(app.eventDate).toBe("2026-09-20");
    expect(app.eventZone).toBe("miraflores");
  });

  it("propagates the backend error so the view can show it", async () => {
    post.mockRejectedValue({ response: { data: { error: "You have already applied to this event." } } });

    await expect(EventApplicationService.apply(5, null)).rejects.toMatchObject({
      response: { data: { error: "You have already applied to this event." } },
    });
  });
});

describe("EventApplicationService — owner decisions", () => {
  it("accepts through the right URL", async () => {
    patch.mockResolvedValue({ data: { ...rawApplication, status: "accepted" } });

    const app = await EventApplicationService.accept(5, 33);

    expect(patch).toHaveBeenCalledWith("/events/5/applications/33/accept");
    expect(app.isAccepted()).toBe(true);
  });

  it("rejects through the right URL", async () => {
    patch.mockResolvedValue({ data: { ...rawApplication, status: "rejected" } });

    const app = await EventApplicationService.reject(5, 33);

    expect(patch).toHaveBeenCalledWith("/events/5/applications/33/reject");
    expect(app.isRejected()).toBe(true);
  });

  it("lists the applicants of an event", async () => {
    get.mockResolvedValue({ data: [rawApplication, { ...rawApplication, id: 34, workerId: 3 }] });

    const apps = await EventApplicationService.listByEvent(5);

    expect(get).toHaveBeenCalledWith("/events/5/applications");
    expect(apps).toHaveLength(2);
    expect(apps.map((a) => a.workerId)).toEqual([2, 3]);
  });
});

describe("EventApplicationService — applicant", () => {
  it("withdraws through the right URL", async () => {
    patch.mockResolvedValue({ data: { ...rawApplication, status: "withdrawn" } });

    const app = await EventApplicationService.withdraw(5, 33);

    expect(patch).toHaveBeenCalledWith("/events/5/applications/33/withdraw");
    expect(app.isWithdrawn()).toBe(true);
  });

  it("never builds a withdraw URL without a real application id", async () => {
    patch.mockResolvedValue({ data: rawApplication });

    // The worker detail view resolves the id from GET /events/mine; if that lookup misses,
    // a null id would produce /events/5/applications/null/withdraw, which the {appId:int}
    // route constraint rejects with a 404 the user reads as "postulacion con error".
    await expect(EventApplicationService.withdraw(5, null)).rejects.toThrow();
    expect(patch).not.toHaveBeenCalled();
  });

  it("reads my applications from /events/mine", async () => {
    get.mockResolvedValue({ data: [rawApplication] });

    const mine = await EventApplicationService.listMine();

    expect(get).toHaveBeenCalledWith("/events/mine");
    expect(mine[0].eventId).toBe(5);
  });
});

describe("EventService — the event the worker applies to", () => {
  const rawEvent = {
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
    applicationDeadline: "2026-09-18T00:00:00.0000000Z",
    status: "open",
    myApplicationStatus: "pending",
    createdAt: "2026-09-08T15:00:00+00:00",
  };

  it("maps the applicant-facing fields", async () => {
    get.mockResolvedValue({ data: rawEvent });

    const ev = await EventService.getById(5);

    expect(ev.myApplicationStatus).toBe("pending");
    expect(ev.acceptedCount).toBe(1);
    expect(ev.spotsRemaining()).toBe(2);
    expect(ev.isOpen()).toBe(true);
  });

  it("reads the deadline the apply form gates on", async () => {
    get.mockResolvedValue({ data: rawEvent });
    const ev = await EventService.getById(5);
    expect(Number.isNaN(new Date(ev.applicationDeadline).getTime())).toBe(false);
  });

  it("only sends the filters that have a value", async () => {
    get.mockResolvedValue({ data: [rawEvent] });

    await EventService.searchOpen({ zone: "miraflores" });

    expect(get).toHaveBeenCalledWith("/events", { params: { zone: "miraflores" } });
  });
});
