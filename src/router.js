/**
 * Router de la aplicación.
 * Capa: raíz
 *
 * Define las rutas de todos los bounded contexts y aplica
 * los guardias de autenticación. El lazy loading garantiza
 * que cada bounded context solo cargue cuando se navega a él.
 */
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./IAM/application/auth.store.js";

const routes = [
  // ──────────────────────────────────────────────────
  // IAM — rutas públicas
  // ──────────────────────────────────────────────────
  { path: "/", redirect: "/login" },
  { path: "/login",            component: () => import("./IAM/presentation/views/LoginView.vue"),           meta: { public: true } },
  { path: "/register",         component: () => import("./IAM/presentation/views/RegisterView.vue"),        meta: { public: true } },
  { path: "/accept-terms",     component: () => import("./IAM/presentation/views/AcceptTermsView.vue"),     meta: { public: true } },
  { path: "/2fa-setup",        component: () => import("./IAM/presentation/views/TwoFactorSetupView.vue"),  meta: { public: true } },
  { path: "/2fa-verify",       component: () => import("./IAM/presentation/views/TwoFactorVerifyView.vue"), meta: { public: true } },
  { path: "/terms",            component: () => import("./Shared/presentation/views/TermsView.vue"),        meta: { public: true } },
  { path: "/privacy",          component: () => import("./Shared/presentation/views/PrivacyView.vue"),      meta: { public: true } },

  // ──────────────────────────────────────────────────
  // Rutas de CLIENTE
  // ──────────────────────────────────────────────────
  {
    path: "/client",
    component: () => import("./Shared/presentation/layouts/ClientLayout.vue"),
    meta: { requiresAuth: true, role: "client" },
    children: [
      { path: "", redirect: "/client/search" },

      // SearchAndCatalog
      { path: "search",          component: () => import("./SearchAndCatalog/presentation/views/SearchView.vue") },
      { path: "worker/:id",      component: () => import("./SearchAndCatalog/presentation/views/WorkerProfileView.vue") },

      // Booking
      { path: "worker/:id/book", component: () => import("./Booking/presentation/views/BookingView.vue") },
      { path: "bookings",        component: () => import("./Booking/presentation/views/ClientBookingsView.vue") },

      // Events
      { path: "events",     component: () => import("./Events/presentation/views/MyEventsView.vue") },
      { path: "events/new", component: () => import("./Events/presentation/views/CreateEventView.vue") },
      { path: "events/:id", component: () => import("./Events/presentation/views/EventDetailClientView.vue") },

      // Shared — mensajería
      { path: "messages",        component: () => import("./Shared/presentation/views/MessagesView.vue") },
      { path: "messages/:userId",component: () => import("./Shared/presentation/views/ChatView.vue") },

      // Profiles
      { path: "profile",         component: () => import("./Profiles/presentation/views/ClientProfileView.vue") },
    ],
  },

  // ──────────────────────────────────────────────────
  // Rutas de TRABAJADORA
  // ──────────────────────────────────────────────────
  {
    path: "/worker",
    component: () => import("./Shared/presentation/layouts/WorkerLayout.vue"),
    meta: { requiresAuth: true, role: "worker" },
    children: [
      { path: "", redirect: "/worker/dashboard" },

      // Profiles
      { path: "dashboard", component: () => import("./Profiles/presentation/views/WorkerDashboardView.vue") },
      { path: "profile",   component: () => import("./Profiles/presentation/views/WorkerProfileEditView.vue") },

      // Booking
      { path: "availability", component: () => import("./Booking/presentation/views/AvailabilityView.vue") },
      { path: "requests",     component: () => import("./Booking/presentation/views/WorkerRequestsView.vue") },

      // ReviewsAndEvaluation
      { path: "reviews", component: () => import("./ReviewsAndEvaluation/presentation/views/MyReviewsView.vue") },

      // Events
      { path: "events",       component: () => import("./Events/presentation/views/AvailableEventsView.vue") },
      { path: "events/:id",   component: () => import("./Events/presentation/views/EventDetailWorkerView.vue") },
      { path: "applications", component: () => import("./Events/presentation/views/MyApplicationsView.vue") },

      // Shared — mensajería
      { path: "messages",         component: () => import("./Shared/presentation/views/MessagesView.vue") },
      { path: "messages/:userId", component: () => import("./Shared/presentation/views/ChatView.vue") },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ──────────────────────────────────────────────────
// Guardia de autenticación
// ──────────────────────────────────────────────────
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.public) {
    if (auth.isLoggedIn && to.path === "/login") {
      return auth.user?.role === "worker" ? "/worker/dashboard" : "/client/search";
    }
    return true;
  }

  if (to.meta.requiresAuth) {
    if (!auth.isLoggedIn) return "/login";
    if (to.meta.role && auth.user?.role !== to.meta.role) {
      const target = auth.user?.role === "worker" ? "/worker/dashboard" : "/client/search";
      if (to.path === target) { auth.clearAuth(); return "/login"; }
      return target;
    }
    return true;
  }

  return true;
});

export default router;
