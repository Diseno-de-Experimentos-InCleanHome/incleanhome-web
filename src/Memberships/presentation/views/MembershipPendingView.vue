<template>
  <div class="pending-view">
    <div class="pending-container card card-elevated">
      <div class="icon-wrapper">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#009960" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <h1 class="page-title">Cuenta en revisión</h1>
      <p class="message">{{ message }}</p>

      <a v-if="whatsappLink" :href="whatsappLink" target="_blank" rel="noopener" class="btn btn-primary btn-full btn-lg whatsapp-btn">
        Enviar comprobante por WhatsApp
      </a>

      <button @click="handleBack" class="btn btn-secondary btn-full back-btn">Volver al inicio de sesión</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../../IAM/application/auth.store.js";

const router = useRouter();
const auth = useAuthStore();

const message = computed(
  () => auth.membershipMessage?.message ||
    "Tu cuenta está pendiente de validación de pago. Envíanos tu voucher por WhatsApp para activarla."
);
const whatsappLink = computed(() => auth.membershipMessage?.whatsappLink);

onMounted(() => {
  if (!auth.membershipMessage) router.replace("/login");
});

function handleBack() {
  auth.clearMembershipPending();
  router.push("/login");
}
</script>

<style scoped>
.pending-view { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.pending-container { width: 100%; max-width: 440px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.08); text-align: center; }
.icon-wrapper { display: flex; justify-content: center; margin-bottom: 1rem; }
.page-title { font-size: 1.5rem; font-weight: 800; color: #1A2E4A; margin-bottom: 0.75rem; }
.message { color: #3A4A5C; font-size: 0.9375rem; line-height: 1.5; margin-bottom: 1.5rem; }
.whatsapp-btn { background-color: #25D366; border-color: #25D366; margin-bottom: 0.75rem; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
.whatsapp-btn:hover { background-color: #1ebc59; }
.back-btn { margin-top: 0.25rem; }
</style>
