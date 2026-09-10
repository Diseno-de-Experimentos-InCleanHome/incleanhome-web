<template>
  <div class="page-wrapper">
    <div class="page-container">
      <router-link :to="homeLink" class="logo-wrapper-link">
        <div class="logo-small">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <span class="brand">InClean<span class="brand-accent">Home</span></span>
      </router-link>

      <Transition name="fade" mode="out-in">
        <div v-if="createdCode" key="done" class="card card-elevated done-card">
          <h2 class="card-title">Reclamo registrado</h2>
          <p class="done-text">Guarda este código: lo necesitarás para consultar el estado de tu reclamo.</p>
          <div class="code-box">{{ createdCode }}</div>
          <router-link :to="`/reclamos/seguimiento?code=${createdCode}`" class="btn btn-primary btn-full btn-lg">Consultar estado</router-link>
          <button @click="resetForm" class="btn btn-secondary btn-full mt-2">Registrar otro reclamo</button>
        </div>

        <div v-else key="form" class="card card-elevated">
          <h2 class="card-title">Libro de reclamaciones</h2>
          <p class="card-subtitle">
            Registra aquí tu reclamo o queja. Es un registro interno — no se envía a
            terceros — y podrás hacer seguimiento del estado con el código que te
            entregamos al final.
            <router-link to="/reclamos/seguimiento" class="link-primary">¿Ya tienes un código?</router-link>
          </p>

          <form @submit.prevent="handleSubmit" class="form">
            <div class="type-toggle">
              <button type="button" :class="['type-btn', form.type === 'reclamo' ? 'type-selected' : '']" @click="form.type = 'reclamo'">Reclamo</button>
              <button type="button" :class="['type-btn', form.type === 'queja' ? 'type-selected' : '']" @click="form.type = 'queja'">Queja</button>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="label">Nombre completo</label>
                <input v-model="form.consumerName" type="text" class="input-field" required />
              </div>
              <div class="form-group">
                <label class="label">DNI / documento</label>
                <input v-model="form.consumerDocument" type="text" class="input-field" />
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="label">Correo</label>
                <input v-model="form.consumerEmail" type="email" class="input-field" required />
              </div>
              <div class="form-group">
                <label class="label">Teléfono</label>
                <input v-model="form.consumerPhone" type="tel" class="input-field" />
              </div>
            </div>
            <div class="form-group">
              <label class="label">Servicio relacionado (opcional)</label>
              <input v-model="form.relatedService" type="text" class="input-field" placeholder="Ej. Limpieza del 03/09/2026" />
            </div>
            <div class="form-group">
              <label class="label">Detalle del {{ form.type }}</label>
              <textarea v-model="form.description" class="input-field no-resize" rows="4" required></textarea>
            </div>
            <div class="form-group">
              <label class="label">¿Qué solicitas? (opcional)</label>
              <textarea v-model="form.consumerRequest" class="input-field no-resize" rows="2"></textarea>
            </div>

            <div v-if="error" class="error-box">{{ error }}</div>
            <button type="submit" class="btn btn-primary btn-full btn-lg submit-btn" :disabled="loading">
              <div v-if="loading" class="spinner spinner-sm"></div>
              {{ loading ? "Enviando..." : "Registrar" }}
            </button>
          </form>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "../../../IAM/application/auth.store.js";
import { ClaimsApi } from "../../infrastructure/claims.api.js";
import { roleHomePath } from "../../../Shared/domain/constants/roles.js";

const auth = useAuthStore();
const homeLink = computed(() => (auth.isLoggedIn ? roleHomePath(auth.user?.role) : "/login"));

function emptyForm() {
  return {
    type: "reclamo",
    consumerName: auth.user?.name || "",
    consumerDocument: "",
    consumerEmail: auth.user?.email || "",
    consumerPhone: auth.user?.phone || "",
    relatedService: "",
    description: "",
    consumerRequest: "",
  };
}

const form = ref(emptyForm());
const loading = ref(false);
const error = ref("");
const createdCode = ref("");

async function handleSubmit() {
  loading.value = true;
  error.value = "";
  try {
    const result = await ClaimsApi.create(form.value);
    createdCode.value = result.code;
  } catch (e) {
    error.value = e.response?.data?.error || "Ocurrió un error, intenta de nuevo";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  createdCode.value = "";
  form.value = emptyForm();
}
</script>

<style scoped>
.page-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; background: linear-gradient(135deg,#E6F9F2 0%,#E6F9F2 100%); }
.page-container { width: 100%; max-width: 560px; }
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
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.no-resize { resize: none; }
.type-toggle { display: flex; gap: 0.5rem; }
.type-btn { flex: 1; padding: 0.625rem; border-radius: 0.5rem; border: 2px solid #c5e8d8; background: white; font-weight: 600; color: #3A4A5C; }
.type-selected { border-color: #009960; background: #E6F9F2; color: #009960; }
.error-box { background:#fee2e2; color:#991b1b; padding:0.75rem; border-radius:0.5rem; font-size:0.875rem; }
.submit-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:18px; height:18px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.done-card { text-align: center; }
.done-text { color: #3A4A5C; font-size: 0.9375rem; margin-bottom: 1rem; }
.code-box { font-family: monospace; font-size: 1.5rem; font-weight: 700; color: #1A2E4A; background: #E6F9F2; border: 1px dashed #009960; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; letter-spacing: 0.05em; }
.mt-2 { margin-top: 0.5rem; }
@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
</style>
