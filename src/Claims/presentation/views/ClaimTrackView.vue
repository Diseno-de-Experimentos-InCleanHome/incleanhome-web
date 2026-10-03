<template>
  <div class="page-wrapper">
    <div class="page-container">
      <router-link :to="homeLink" class="logo-wrapper-link">
        <div class="logo-small">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <span class="brand">InClean<span class="brand-accent">Home</span></span>
      </router-link>

      <div class="card card-elevated">
        <h2 class="card-title">Seguimiento de reclamo</h2>
        <p class="card-subtitle">
          Ingresa el código que recibiste al registrar tu reclamo.
          <router-link to="/reclamos" class="link-primary">¿Aún no tienes uno?</router-link>
        </p>

        <form @submit.prevent="handleTrack" class="form">
          <div class="form-group">
            <label class="label">Código de reclamo</label>
            <input v-model="code" type="text" class="input-field code-field" placeholder="RC-2026-000123" required />
          </div>
          <div v-if="error" class="error-box">{{ error }}</div>
          <button type="submit" class="btn btn-primary btn-full btn-lg submit-btn" :disabled="loading">
            <div v-if="loading" class="spinner spinner-sm"></div>
            {{ loading ? "Buscando..." : "Consultar" }}
          </button>
        </form>

        <div v-if="claim" class="result-box">
          <div class="result-row">
            <span class="result-label">Tipo</span>
            <span class="result-value">{{ claim.type === "reclamo" ? "Reclamo" : "Queja" }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Estado</span>
            <span :class="statusBadge(claim.status)">{{ statusLabel(claim.status) }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Registrado</span>
            <span class="result-value">{{ formatDate(claim.createdAt) }}</span>
          </div>
          <div v-if="claim.adminNote" class="note-box">{{ claim.adminNote }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { ClaimsApi } from "../../infrastructure/claims.api.js";
import { roleHomePath } from "../../../Shared/domain/constants/roles.js";

const route = useRoute();
const auth = useAuthStore();
const homeLink = computed(() => (auth.isLoggedIn ? roleHomePath(auth.user?.role) : "/login"));
const code = ref(route.query.code || "");
const claim = ref(null);
const loading = ref(false);
const error = ref("");

async function handleTrack() {
  loading.value = true;
  error.value = "";
  claim.value = null;
  try {
    claim.value = await ClaimsApi.track(code.value.trim());
  } catch (e) {
    error.value = e.response?.status === 404 ? "No encontramos un reclamo con ese código" : "Ocurrió un error, intenta de nuevo";
  } finally {
    loading.value = false;
  }
}

function statusBadge(s) {
  return { registered: "badge badge-yellow", in_review: "badge badge-blue", resolved: "badge badge-green", rejected: "badge badge-red" }[s] || "badge badge-gray";
}
function statusLabel(s) {
  return { registered: "Registrado", in_review: "En revisión", resolved: "Resuelto", rejected: "Rechazado" }[s] || s;
}
function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

onMounted(() => {
  if (code.value) handleTrack();
});
</script>

<style scoped>
.page-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.page-container { width: 100%; max-width: 480px; }
.logo-wrapper-link { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; text-decoration: none; }
.logo-small { width:40px; height:40px; background: linear-gradient(135deg,#009960,#00B272); border-radius:12px; display:flex; align-items:center; justify-content:center; }
.brand { font-size:1.5rem; font-weight:800; color:#1A2E4A; }
.brand-accent { color:#009960; }
.card-elevated { box-shadow:0 20px 40px rgba(0,0,0,0.08); padding: 2rem; }
.card-title { font-size:1.25rem; font-weight:700; color:#1A2E4A; margin-bottom:0.5rem; }
.card-subtitle { color:#3A4A5C; font-size:0.875rem; margin-bottom:1.5rem; line-height: 1.5; }
.link-primary { color:#009960; font-weight:500; text-decoration: none; margin-left: 0.25rem; }
.link-primary:hover { text-decoration: underline; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.code-field { text-transform: uppercase; }
.error-box { background:#fee2e2; color:#991b1b; padding:0.75rem; border-radius:0.5rem; font-size:0.875rem; }
.submit-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:18px; height:18px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.result-box { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #E6F9F2; display: flex; flex-direction: column; gap: 0.75rem; }
.result-row { display: flex; align-items: center; justify-content: space-between; }
.result-label { font-size: 0.8125rem; color: #7A8FA6; font-weight: 600; }
.result-value { color: #1A2E4A; font-weight: 600; }
.note-box { font-size: 0.875rem; color: #3A4A5C; background: #E6F9F2; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #c5e8d8; }
</style>
