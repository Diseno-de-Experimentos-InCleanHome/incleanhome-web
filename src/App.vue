<template>
  <router-view />
  <Transition name="fade">
    <div v-if="toast.visible" :class="['toast', `toast-${toast.type}`]">
      {{ toast.message }}
    </div>
  </Transition>
</template>

<script setup>
/**
 * Componente raíz de la app.
 * Solo monta el router-view y el toast global (Shared).
 */
import { useToastStore } from "./Shared/application/toast.store.js";
const toast = useToastStore();
</script>

<style>
.toast { position: fixed; right: 1rem; bottom: 1rem; background: rgba(17,24,39,0.95); color: white; padding: 0.75rem 1rem; border-radius: 0.5rem; box-shadow: 0 6px 20px rgba(2,6,23,0.2); z-index: 60; max-width: 90vw; }
.toast-success { background:#00B272; }
.toast-error { background:#ef4444; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease, transform .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }
@media (max-width: 640px) { .toast { right: 0.5rem; left: 0.5rem; bottom: 0.75rem; } }
</style>
