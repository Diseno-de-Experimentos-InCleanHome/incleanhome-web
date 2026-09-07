<template>
  <nav class="top-nav" :style="{ '--nav-accent': accentColor }">
    <div class="nav-container">
      <div class="nav-content">

        <router-link :to="brandTo" class="brand-link">
          <div class="logo-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span class="brand-text">InClean<span class="brand-accent">Home</span></span>
        </router-link>

        <!-- Desktop nav: full row, only shown once there's genuinely room for it -->
        <div class="nav-menu">
          <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
            class="nav-item"
            :class="{ 'active': $route.path.startsWith(link.to) }"
            :aria-label="t(link.label)">
            <span v-html="link.icon" class="nav-icon"></span>
            <span class="nav-label">{{ t(link.label) }}</span>
          </router-link>

          <div class="nav-divider"></div>

          <button @click="handleLogout" class="nav-item nav-logout" :aria-label="t('nav.logout')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span class="nav-label">{{ t('nav.logout') }}</span>
          </button>

          <button @click="toggleLang" class="nav-item lang-btn" :aria-label="t('nav.language')">
            {{ locale === 'es' ? 'EN' : 'ES' }}
          </button>
        </div>

        <!-- Mobile/tablet trigger: replaces the row entirely below the breakpoint -->
        <button class="hamburger-btn" @click="mobileOpen = !mobileOpen"
          :aria-expanded="mobileOpen" :aria-label="t('nav.menu')">
          <svg v-if="!mobileOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
      </div>
    </div>

    <Transition name="slide-down">
      <div v-if="mobileOpen" class="mobile-backdrop" @click="mobileOpen = false">
        <div class="mobile-panel" @click.stop>
          <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
            class="mobile-item"
            :class="{ 'active': $route.path.startsWith(link.to) }"
            @click="mobileOpen = false">
            <span v-html="link.icon" class="nav-icon"></span>
            <span>{{ t(link.label) }}</span>
          </router-link>

          <div class="mobile-divider"></div>

          <button @click="handleLogout" class="mobile-item mobile-logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>{{ t('nav.logout') }}</span>
          </button>

          <button @click="toggleLang" class="mobile-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z"/></svg>
            <span>{{ locale === 'es' ? 'English' : 'Español' }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { AuthStorage } from "../../infrastructure/storage/auth.storage.js";

defineProps({
  navLinks: { type: Array, required: true },
  brandTo: { type: String, required: true },
  /** CSS color value used for hover/active accents — pass an existing --color-* variable. */
  accentColor: { type: String, default: "var(--color-primary)" },
});

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const mobileOpen = ref(false);

// Never leave the panel open behind a new page.
watch(() => route.path, () => { mobileOpen.value = false; });

function handleLogout() {
  auth.clearAuth();
  router.push("/");
}

function toggleLang() {
  locale.value = locale.value === "es" ? "en" : "es";
  AuthStorage.setLang(locale.value);
}
</script>

<style scoped>
.top-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  width: 100%;
}

.nav-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 1rem 1rem;
}
@media (min-width: 640px) { .nav-container { padding: 1rem 1.5rem; } }
@media (min-width: 1024px) { .nav-container { padding: 1rem 2rem; } }

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand-link { display: flex; align-items: center; gap: 0.75rem; transition: transform 0.3s; flex-shrink: 0; }
.brand-link:hover { transform: scale(1.05); }
.brand-link:active { transform: scale(0.95); }

.logo-box {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, var(--nav-accent), var(--color-secondary));
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.brand-text { font-weight: 800; font-size: 1.5rem; color: var(--color-text); letter-spacing: -0.025em; display: none; white-space: nowrap; }
@media (min-width: 480px) { .brand-text { display: block; } }
.brand-accent { color: var(--nav-accent); }

/* ---------- Desktop row: hidden below the breakpoint, hamburger takes over ---------- */
.nav-menu {
  display: none;
  align-items: center;
  gap: 0.375rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-icon { flex-shrink: 0; width: 1.375rem; height: 1.375rem; display: flex; align-items: center; justify-content: center; }
.nav-icon :deep(svg) { width: 1.375rem; height: 1.375rem; }

.nav-item:hover { background-color: var(--color-bg); color: var(--nav-accent); }
.nav-item:active { transform: scale(0.96); }
.nav-item.active { background-color: var(--color-bg); color: var(--nav-accent); border: 1px solid var(--color-border); }

.nav-divider { width: 1px; height: 2rem; background-color: var(--color-border); margin: 0 0.375rem; }

.nav-logout:hover { background-color: #fef2f2; color: var(--color-danger); }

.lang-btn { margin-left: 0.25rem; padding: 0.625rem 1rem; background-color: var(--color-bg); border: 1px solid var(--color-border); }
.lang-btn:hover { background-color: white; }

/* ---------- Hamburger trigger: the default below 1500px ---------- */
.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  color: var(--color-text);
  flex-shrink: 0;
}
.hamburger-btn:hover { background-color: var(--color-bg); }

@media (min-width: 1500px) {
  .nav-menu { display: flex; }
  .hamburger-btn { display: none; }
}

/* ---------- Mobile dropdown panel ---------- */
.mobile-backdrop {
  position: fixed;
  inset: 0;
  top: 0;
  background: rgba(26, 46, 74, 0.15);
  z-index: 49;
}

.mobile-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08);
  padding: 0.75rem;
  max-height: calc(100vh - 5rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  width: 100%;
  text-align: left;
}
.mobile-item:hover, .mobile-item:active { background-color: var(--color-bg); }
.mobile-item.active { background-color: var(--color-bg); color: var(--nav-accent); }
.mobile-item .nav-icon { width: 1.25rem; height: 1.25rem; }
.mobile-item .nav-icon :deep(svg) { width: 1.25rem; height: 1.25rem; }

.mobile-divider { height: 1px; background-color: var(--color-border); margin: 0.5rem 0.25rem; }
.mobile-logout { color: var(--color-danger); }

.slide-down-enter-active, .slide-down-leave-active { transition: opacity 0.15s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; }
</style>
