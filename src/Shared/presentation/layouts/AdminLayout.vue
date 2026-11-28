<template>
  <div class="layout-wrapper">
    <TopNav :nav-links="navLinks" brand-to="/admin/memberships" accent-color="var(--color-primary)" />

    <main class="main-container">
      <PasswordChangeBanner />
      <router-view />
    </main>
  </div>
</template>

<script setup>
import TopNav from "../components/TopNav.vue";
import PasswordChangeBanner from "../../../IAM/presentation/components/PasswordChangeBanner.vue";

const navLinks = [
  { to: "/admin/memberships", label: "nav.memberships", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  { to: "/admin/claims",      label: "nav.claims",      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>' },
  { to: "/admin/account", label: "nav.security", iconOnly: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
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
