<template>
  <router-link :to="`${basePath}/${event.id}`" class="card event-card">
    <div class="event-header">
      <div>
        <div class="event-title">{{ event.title }}</div>
        <div class="event-services">
          <span v-for="svc in event.serviceTypes" :key="svc" class="svc-chip">{{ t(`worker.services.${svc}`) }}</span>
        </div>
      </div>
      <span :class="statusBadge(event.status)">{{ t(`events.status.${event.status}`) }}</span>
    </div>

    <div class="meta-row">
      <span class="meta-item"><AppIcon name="calendar" :size="15" /> {{ event.date }}</span>
      <span class="meta-item"><AppIcon name="clock" :size="15" /> {{ event.startTime }} – {{ event.endTime }}</span>
      <span class="meta-item"><AppIcon name="pin" :size="15" /> {{ t(`worker.zones.${event.zone}`) }}</span>
    </div>

    <div class="event-footer">
      <span class="quota"><AppIcon name="users" :size="15" /> {{ event.acceptedCount }}/{{ event.workersNeeded }} {{ t('events.workersNeeded') }}</span>
      <span class="rate">S/. {{ event.hourlyRateOffered }}/{{ t('search.perHour') }}</span>
    </div>
  </router-link>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

defineProps({
  event: { type: Object, required: true },
  basePath: { type: String, required: true },
});

const { t } = useI18n();

function statusBadge(s) {
  return {
    open: "badge badge-yellow",
    staffed: "badge badge-blue",
    in_progress: "badge badge-blue",
    completed: "badge badge-green",
    cancelled: "badge badge-gray",
  }[s] || "badge badge-gray";
}
</script>

<style scoped>
.event-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, transform 0.15s;
}
.event-card:hover { border-color: #009960; transform: translateY(-2px); }

.event-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.event-title { font-weight: 700; color: #1A2E4A; font-size: 1.0625rem; margin-bottom: 0.375rem; }
.event-services { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.svc-chip { font-size: 0.75rem; background: #E6F9F2; color: #009960; padding: 0.125rem 0.5rem; border-radius: 9999px; font-weight: 600; }

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #3A4A5C;
}
.meta-item { display: flex; align-items: center; gap: 0.25rem; }

.event-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #E6F9F2;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  font-size: 0.875rem;
}
.quota { display: flex; align-items: center; gap: 0.25rem; color: #3A4A5C; font-weight: 600; }
.rate { color: #009960; font-weight: 700; }
</style>
