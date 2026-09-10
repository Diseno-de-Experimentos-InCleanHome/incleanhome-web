<template>
  <div class="view-container">
    <h1 class="page-title mb-6">Libro de reclamaciones</h1>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <div v-else class="list">
      <div class="tabs-container">
        <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
          :class="['btn btn-sm', activeTab === tab.value ? 'btn-primary' : 'btn-secondary']">
          {{ tab.label }} <span v-if="tabCount(tab.value)" class="tab-badge" :class="activeTab === tab.value ? 'badge-active' : 'badge-inactive'">{{ tabCount(tab.value) }}</span>
        </button>
      </div>

      <div v-if="!filteredClaims.length" class="card empty-state">
        <p class="empty-text">No hay reclamos en este estado</p>
      </div>

      <div v-for="c in filteredClaims" :key="c.id" class="card claim-card">
        <div class="row-header">
          <div>
            <div class="claim-code">{{ c.code }} <span class="type-tag">{{ c.type === "reclamo" ? "Reclamo" : "Queja" }}</span></div>
            <div class="consumer-line">{{ c.consumerName }} · {{ c.consumerEmail }} <span v-if="c.consumerPhone">· {{ c.consumerPhone }}</span></div>
          </div>
          <span :class="statusBadge(c.status)">{{ statusLabel(c.status) }}</span>
        </div>

        <div v-if="c.relatedService" class="meta-row">Servicio: {{ c.relatedService }}</div>
        <p class="description">{{ c.description }}</p>
        <div v-if="c.consumerRequest" class="request-box"><strong>Solicita:</strong> {{ c.consumerRequest }}</div>

        <div class="review-box">
          <textarea v-model="notes[c.id]" class="input-field no-resize" rows="2" placeholder="Nota del admin (opcional)"></textarea>
          <div class="action-buttons">
            <select v-model="targetStatus[c.id]" class="input-field status-select">
              <option value="in_review">En revisión</option>
              <option value="resolved">Resuelto</option>
              <option value="rejected">Rechazado</option>
            </select>
            <button @click="review(c.id)" class="btn btn-primary btn-sm" :disabled="submitting === c.id">Actualizar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useToastStore } from "../../../Shared/application/toast.store.js";
import { ClaimsApi } from "../../infrastructure/claims.api.js";

const toast = useToastStore();
const claims = ref([]);
const loading = ref(true);
const submitting = ref(null);
const activeTab = ref("registered");
const notes = reactive({});
const targetStatus = reactive({});

const tabs = [
  { value: "registered", label: "Registrados" },
  { value: "in_review", label: "En revisión" },
  { value: "resolved", label: "Resueltos" },
  { value: "rejected", label: "Rechazados" },
  { value: "all", label: "Todos" },
];

const filteredClaims = computed(() =>
  activeTab.value === "all" ? claims.value : claims.value.filter(c => c.status === activeTab.value)
);
const tabCount = (tab) => tab === "all" ? claims.value.length : claims.value.filter(c => c.status === tab).length;

function statusBadge(s) {
  return { registered: "badge badge-yellow", in_review: "badge badge-blue", resolved: "badge badge-green", rejected: "badge badge-red" }[s] || "badge badge-gray";
}
function statusLabel(s) {
  return { registered: "Registrado", in_review: "En revisión", resolved: "Resuelto", rejected: "Rechazado" }[s] || s;
}

async function review(id) {
  const status = targetStatus[id] || "in_review";
  submitting.value = id;
  try {
    await ClaimsApi.review(id, { status, note: notes[id] || null });
    toast.success("Reclamo actualizado");
    await load();
  } catch (e) {
    toast.error(e.response?.data?.error || "Ocurrió un error");
  } finally {
    submitting.value = null;
  }
}

async function load() {
  loading.value = true;
  claims.value = await ClaimsApi.list();
  loading.value = false;
}

onMounted(load);
</script>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; }
.mb-6 { margin-bottom: 1.5rem; }
.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:28px; height:28px; animation: spin 1s linear infinite; }
.spinner-lg { width:36px; height:36px; }
@keyframes spin { to { transform: rotate(360deg); } }

.list { display: flex; flex-direction: column; gap: 1rem; }
.tabs-container { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.tab-badge { display: inline-flex; align-items: center; justify-content: center; padding: 0.1rem 0.4rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-left: 0.25rem; }
.badge-active { background:white; color:#009960; }
.badge-inactive { background:#c5e8d8; color:#3A4A5C; }

.empty-state { text-align: center; padding: 4rem 0; }
.empty-text { color: #3A4A5C; }

.claim-card { display: flex; flex-direction: column; gap: 0.625rem; }
.row-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.claim-code { font-weight: 700; color: #1A2E4A; font-family: monospace; }
.type-tag { font-family: inherit; font-size: 0.75rem; font-weight: 600; color: #009960; background: #E6F9F2; padding: 0.125rem 0.5rem; border-radius: 9999px; margin-left: 0.375rem; }
.consumer-line { font-size: 0.8125rem; color: #3A4A5C; margin-top: 0.125rem; }

.meta-row { font-size: 0.8125rem; color: #7A8FA6; }
.description { font-size: 0.9375rem; color: #1A2E4A; line-height: 1.5; }
.request-box { font-size: 0.875rem; color: #3A4A5C; background: #E6F9F2; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #c5e8d8; }

.review-box { display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid #E6F9F2; padding-top: 0.75rem; }
.no-resize { resize: none; }
.action-buttons { display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center; flex-wrap: wrap; }
.status-select { width: auto; }
</style>
