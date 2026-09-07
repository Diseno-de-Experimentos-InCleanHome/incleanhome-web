<template>
  <div class="layout-wrapper">
    <TopNav :nav-links="navLinks" brand-to="/client/search" accent-color="var(--color-primary)" />

    <main class="main-container">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import TopNav from "../components/TopNav.vue";

const navLinks = [
  { to: "/client/search",   label: "nav.search",   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
  { to: "/client/bookings", label: "nav.bookings", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { to: "/client/events",   label: "nav.events",   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2-6.3-4.6-6.3 4.6 2.3-7.2-6-4.4h7.6z"/></svg>' },
  { to: "/client/messages", label: "nav.messages", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>' },
  { to: "/client/profile",  label: "nav.profile",  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }
];
</script>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
  position: relative;
}

.main-container {
  flex: 1;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
}
@media (min-width: 670px) {
  .main-container { padding: 3rem 1.5rem; }
}
@media (min-width: 1300px) {
  .main-container { padding: 3rem 2rem; }
}
</style>
