/**
 * Arreglos de la auditoría de la web. El API siempre se simula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

const get = vi.fn();
vi.mock("../src/Shared/infrastructure/http/api.client.js", () => ({
  default: { get: (...a) => get(...a), defaults: { headers: { common: {} } } },
}));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import EventCard from "../src/Events/presentation/components/EventCard.vue";
import WorkerRequestsView from "../src/Booking/presentation/views/WorkerRequestsView.vue";

const source = (path) => readFileSync(join(process.cwd(), path), "utf8");
const views = readdirSync(join(process.cwd(), "src"), { recursive: true })
  .filter((file) => file.endsWith(".vue")).map((file) => join("src", file));

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  i18n.global.locale.value = "es";
});

describe("Auditoría a) - Tarifa por hora sin barra doble", () => {
  it.each([["es", "S/. 25/hora"], ["en", "S/. 25/hour"]])("testTarjetaDeEvento_en %s", (locale, text) => {
    i18n.global.locale.value = locale;
    const event = { id: 1, title: "Evento", status: "open", zone: "miraflores", serviceType: "cocina", hourlyRateOffered: 25, acceptedCount: 0, workersNeeded: 2 };

    const wrapper = mount(EventCard, { props: { event, to: "/x" }, global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: { template: "<div><slot /></div>" } } } });

    expect(wrapper.find(".rate").text()).toBe(text);
  });

  it("testVistas_SinBarraRepetidaNiTextoFijo", () => {
    for (const view of views) {
      expect(source(view), view).not.toMatch(/\/\{\{ t\('search\.perHour'\)|\}\}\/hora/);
    }
  });
});

describe("Auditoría b) - Solicitudes sin ganancia inexistente", () => {
  it("testSolicitud_MuestraSoloElTotal", async () => {
    get.mockResolvedValue({ data: [{ id: 1, clientId: 2, clientName: "Persona", serviceType: "cocina", status: "pending", date: "2026-11-30", startTime: "08:00", endTime: "10:00", hours: 2, address: "x", totalAmount: 40 }] });

    const wrapper = mount(WorkerRequestsView, { global: { plugins: [i18n], stubs: { AppIcon: true, RouterLink: true } } });
    await flushPromises();

    const footer = wrapper.find(".card-footer").text();
    expect(footer).toContain("Total referencial: S/. 40");
    expect(footer).not.toMatch(/ganancia|undefined/i);
  });
});

describe("Auditoría c) - Lenguaje neutro", () => {
  it.each([
    "index.html",
    "src/Shared/infrastructure/i18n/i18n.js",
    "src/Booking/presentation/views/ClientBookingsView.vue",
    "src/SearchAndCatalog/presentation/views/WorkerProfileView.vue",
  ])("testTextos_SinFemeninoGenerico en %s", (file) => {
    expect(source(file)).not.toMatch(/trabajadora|bienvenida de nuevo$|"Bienvenida/im);
  });

  it.each(["es", "en"])("testClavesNuevas_en %s", (locale) => {
    for (const key of ["search.findWorkers", "profile.notFound"]) {
      expect(i18n.global.te(key, locale), key).toBe(true);
    }
  });
});
