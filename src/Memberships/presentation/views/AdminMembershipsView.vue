<template>
  <div class="view-container">
    <h1 class="page-title mb-6">Membresías de trabajadores</h1>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <div v-else class="list">
      <div class="tabs-container">
        <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
          :class="['btn btn-sm', activeTab === tab.value ? 'btn-primary' : 'btn-secondary']">
          {{ tab.label }} <span v-if="tabCount(tab.value)" class="tab-badge" :class="activeTab === tab.value ? 'badge-active' : 'badge-inactive'">{{ tabCount(tab.value) }}</span>
        </button>
      </div>

      <div v-if="!filteredMemberships.length" class="card empty-state">
        <p class="empty-text">No hay solicitudes en este estado</p>
      </div>

      <div v-for="m in filteredMemberships" :key="m.workerId" class="card membership-card">
        <div class="row-header">
          <div>
            <div class="worker-name">{{ m.workerName }}</div>
            <div class="worker-contact">{{ m.workerEmail }} <span v-if="m.workerPhone">· {{ m.workerPhone }}</span></div>
          </div>
          <span :class="statusBadge(m.status)">{{ statusLabel(m.status) }}</span>
        </div>

        <div class="meta-row">
          <span class="meta-item">Solicitado: {{ formatDate(m.requestedAt) }}</span>
          <span v-if="m.reviewedAt" class="meta-item">Revisado: {{ formatDate(m.reviewedAt) }}</span>
        </div>

        <div v-if="m.adminNote" class="note-box">{{ m.adminNote }}</div>

        <div class="review-box">
          <textarea v-model="notes[m.workerId]" class="input-field no-resize" rows="2" placeholder="Nota (opcional)"></textarea>
          <div class="action-buttons">
            <button v-if="m.status !== 'rejected'" @click="review(m.workerId, 'rejected')" class="btn btn-danger btn-sm" :disabled="submitting === m.workerId">Rechazar</button>
            <button v-if="m.status !== 'pending'" @click="review(m.workerId, 'pending')" class="btn btn-secondary btn-sm" :disabled="submitting === m.workerId">Volver a pendiente</button>
            <button v-if="m.status !== 'active'" @click="review(m.workerId, 'active')" class="btn btn-success btn-sm" :disabled="submitting === m.workerId">Aprobar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useToastStore } from "../../../Shared/application/toast.store.js";
import { MembershipApi } from "../../infrastructure/membership.api.js";

const toast = useToastStore();
const memberships = ref([]);
const loading = ref(true);
const submitting = ref(null);
const activeTab = ref("pending");
const notes = reactive({});

const tabs = [
  { value: "pending", label: "Pendientes" },
  { value: "active", label: "Activas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "all", label: "Todas" },
];

const filteredMemberships = computed(() =>
  activeTab.value === "all" ? memberships.value : memberships.value.filter(m => m.status === activeTab.value)
);
const tabCount = (tab) => tab === "all" ? memberships.value.length : memberships.value.filter(m => m.status === tab).length;

function statusBadge(s) {
  return { pending: "badge badge-yellow", active: "badge badge-green", rejected: "badge badge-red" }[s] || "badge badge-gray";
}
function statusLabel(s) {
  return { pending: "Pendiente", active: "Activa", rejected: "Rechazada" }[s] || s;
}
function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

async function review(workerId, status) {
  submitting.value = workerId;
  try {
    await MembershipApi.review(workerId, { status, note: notes[workerId] || null });
    toast.success(status === "active" ? "Membresía aprobada" : status === "rejected" ? "Membresía rechazada" : "Membresía reiniciada a pendiente");
    await load();
  } catch (e) {
    toast.error(e.response?.data?.error || "Ocurrió un error");
  } finally {
    submitting.value = null;
  }
}

async function load() {
  loading.value = true;
  memberships.value = await MembershipApi.list();
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

.membership-card { display: flex; flex-direction: column; gap: 0.75rem; }
.row-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.worker-name { font-weight: 700; color: #1A2E4A; }
.worker-contact { font-size: 0.8125rem; color: #3A4A5C; }

.meta-row { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.8125rem; color: #7A8FA6; }

.note-box { font-size: 0.875rem; color: #3A4A5C; background: #E6F9F2; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #c5e8d8; }

.review-box { display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid #E6F9F2; padding-top: 0.75rem; }
.no-resize { resize: none; }
.action-buttons { display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }
</style>
