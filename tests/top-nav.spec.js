/**
 * US40 — el acceso a "Seguridad" en la barra superior, sin ensanchar la fila de escritorio.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, RouterLinkStub } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

vi.mock("vue-router", () => ({ useRoute: () => ({ path: "/worker/account" }), useRouter: () => ({ push: vi.fn() }) }));

import i18n from "../src/Shared/infrastructure/i18n/i18n.js";
import WorkerLayout from "../src/Shared/presentation/layouts/WorkerLayout.vue";
import ClientLayout from "../src/Shared/presentation/layouts/ClientLayout.vue";
import AdminLayout from "../src/Shared/presentation/layouts/AdminLayout.vue";

const mountLayout = (layout) => mount(layout, {
  global: {
    plugins: [i18n], stubs: { RouterLink: RouterLinkStub, RouterView: true },
    mocks: { $route: { path: "/worker/account" } },
  },
});

describe("US40 - Enlace de seguridad", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    i18n.global.locale.value = "es";
  });

  it.each([["client", ClientLayout], ["worker", WorkerLayout], ["admin", AdminLayout]])(
    "testBarra de %s: icono con nombre accesible en escritorio y texto en el menú", async (role, layout) => {
      const wrapper = mountLayout(layout);
      const link = () => wrapper.findAllComponents(RouterLinkStub)
        .filter((item) => item.props("to") === `/${role}/account`);

      const [desktop] = link();
      expect(desktop.attributes("title")).toBe("Seguridad");
      expect(desktop.attributes("aria-label")).toBe("Seguridad");
      expect(desktop.text()).toBe("");

      await wrapper.find(".hamburger-btn").trigger("click");

      expect(link()[1].text()).toBe("Seguridad");
    });

  it.each([["worker", WorkerLayout, true], ["client", ClientLayout, false], ["admin", AdminLayout, false]])(
    "testEspaciado de %s", (_, layout, dense) => {
      expect(mountLayout(layout).find(".nav-menu").classes().includes("dense")).toBe(dense);
    });
});
