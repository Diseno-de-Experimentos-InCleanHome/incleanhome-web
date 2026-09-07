<template>
  <div class="view-container">
    <h1 class="page-title mb-6">{{ t('nav.requests') }}</h1>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <div v-else-if="!bookings.length" class="card empty-state">
      <AppIcon name="emptyBox" :size="44" class="empty-icon" />
      <p class="empty-text">Sin solicitudes de servicio</p>
    </div>

    <div v-else class="booking-list">
      <!-- Tabs -->
      <div class="tabs-container">
        <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
          :class="['btn btn-sm', activeTab === tab.value ? 'btn-primary' : 'btn-secondary']">
          {{ tab.label }} <span v-if="tabCount(tab.value)" class="tab-badge" :class="activeTab === tab.value ? 'badge-active' : 'badge-inactive'">{{ tabCount(tab.value) }}</span>
        </button>
      </div>

      <div v-for="b in filteredBookings" :key="b.id" class="card">
        <div class="booking-header">
          <div class="client-info">
            <div class="avatar-sm avatar-aqua">
              <span class="avatar-initial">{{ (b.clientName || 'C')[0] }}</span>
            </div>
            <div>
              <div class="client-name">{{ b.clientName }}</div>
              <div class="client-service">{{ t(`worker.services.${b.serviceType}`) }}</div>
            </div>
          </div>
          <span :class="statusBadge(b.status)">{{ t(`booking.status.${b.status}`) }}</span>
        </div>

        <div class="meta-row">
          <span class="meta-item"><AppIcon name="calendar" :size="15" /> {{ b.date }}</span>
          <span class="meta-item"><AppIcon name="clock" :size="15" /> {{ b.startTime }} – {{ b.endTime }} ({{ b.hours }}h)</span>
          <span class="meta-item"><AppIcon name="pin" :size="15" /> {{ b.address }}</span>
        </div>

        <div v-if="b.notes" class="notes-box">
          <AppIcon name="chat" :size="15" /> {{ b.notes }}
        </div>

        <div class="card-footer">
          <div>
            <span class="earning-label">Tu ganancia: </span>
            <span class="earning-amount">S/. {{ b.workerEarning }}</span>
            <span class="total-amount">(total S/. {{ b.totalAmount }})</span>
          </div>
          <div class="action-buttons" v-if="b.status === 'pending'">
            <button @click="updateStatus(b.id, 'rejected')" class="btn btn-danger btn-sm">{{ t('common.reject') }}</button>
            <button @click="updateStatus(b.id, 'accepted')" class="btn btn-success btn-sm">{{ t('common.accept') }}</button>
          </div>
          <div class="action-buttons" v-else-if="b.status === 'accepted'">
            <button @click="updateStatus(b.id, 'completed')" class="btn btn-success btn-sm"><AppIcon name="check" :size="14" /> {{ t('common.complete') }}</button>
            <router-link :to="`/worker/messages/${b.clientId}`" class="btn btn-secondary btn-sm" :aria-label="t('nav.messages')"><AppIcon name="chat" :size="14" /></router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useToastStore } from "../../../Shared/application/toast.store.js";
import { BookingService } from "../../application/booking.service.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const toast = useToastStore();
const bookings = ref([]);
const loading = ref(true);
const activeTab = ref("pending");

const tabs = [
  { value: "pending", label: "Pendientes" },
  { value: "accepted", label: "Aceptadas" },
  { value: "completed", label: "Completadas" },
  { value: "all", label: "Todas" },
];

const filteredBookings = computed(() =>
  activeTab.value === "all" ? bookings.value : bookings.value.filter(b => b.status === activeTab.value)
);
const tabCount = (tab) => tab === "all" ? bookings.value.length : bookings.value.filter(b => b.status === tab).length;

function statusBadge(s) {
  return { pending:"badge badge-yellow", accepted:"badge badge-blue", completed:"badge badge-green", rejected:"badge badge-red", cancelled:"badge badge-gray" }[s] || "badge badge-gray";
}

async function updateStatus(id, status) {
  await BookingService.updateStatus(id, status);
  toast.success(status === "accepted" ? "Reserva aceptada" : status === "completed" ? "Servicio completado" : "Reserva rechazada");
  await load();
}

async function load() {
  loading.value = true;
  bookings.value = await BookingService.list();
  loading.value = false;
}

onMounted(load);
</script>

<style scoped>
.view-container {
  max-width: 1024px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #1A2E4A;
}
.mb-6 { margin-bottom: 1.5rem; }

.loader-wrapper {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
}
.empty-icon { color: #7A8FA6; margin-bottom: 1rem; }
.empty-text { color: #3A4A5C; }

.booking-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tabs-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.25rem;
}
.badge-active { background:white; color:#009960; }
.badge-inactive { background:#c5e8d8; color:#3A4A5C; }

.booking-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.client-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-sm { width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.avatar-aqua { background:#00B272; }
.avatar-initial { color:white; font-size:0.875rem; font-weight:700; }
.client-name { font-weight:700; color:#1A2E4A; }
.client-service { font-size:0.8125rem; color:#3A4A5C; }

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #3A4A5C;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.notes-box { 
  margin-top:0.75rem; 
  font-size:0.875rem; 
  color:#3A4A5C; 
  background:#E6F9F2; 
  padding:0.75rem; 
  border-radius:0.5rem; 
  border: 1px solid #c5e8d8;
}

.card-footer { 
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top:1px solid #E6F9F2; 
  margin-top:0.875rem; 
  padding-top:0.875rem; 
}
.earning-label { font-size:0.8125rem; color:#3A4A5C; }
.earning-amount { font-weight:700; color:#00B272; margin-left:0.25rem; }
.total-amount { font-size:0.75rem; color:#7A8FA6; margin-left:0.25rem; }

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:28px; height:28px; animation: spin 1s linear infinite; }
.spinner-lg { width:36px; height:36px; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
