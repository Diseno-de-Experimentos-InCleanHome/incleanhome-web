<template>
  <div class="view-container">
    <div class="view-header mb-6">
      <h1 class="page-title">{{ t('events.availableEvents') }}</h1>
    </div>

    <div class="card filters-card mb-5">
      <div class="filters-grid">
        <select v-model="filters.serviceType" class="input-field" @change="doSearch">
          <option value="">{{ t('search.allServices') }}</option>
          <option v-for="s in serviceOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <select v-model="filters.zone" class="input-field" @change="doSearch">
          <option value="">{{ t('search.allZones') }}</option>
          <option v-for="z in zoneOptions" :key="z.value" :value="z.value">{{ z.label }}</option>
        </select>
        <input v-model="filters.date" type="date" class="input-field" @change="doSearch" />
      </div>
    </div>

    <div v-if="loading" class="loader-wrapper"><div class="spinner spinner-lg"></div></div>

    <div v-else-if="!events.length" class="card empty-state">
      <AppIcon name="emptyBox" :size="44" class="empty-icon" />
      <p class="empty-text">{{ t('events.noOpenEvents') }}</p>
    </div>

    <div v-else class="event-list">
      <EventCard v-for="e in events" :key="e.id" :event="e" base-path="/worker/events" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { EventService } from "../../application/event.service.js";
import { buildServiceOptions } from "../../../Shared/domain/constants/services.js";
import { buildZoneOptions } from "../../../Shared/domain/constants/zones.js";
import EventCard from "../components/EventCard.vue";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const events = ref([]);
const loading = ref(true);
const filters = ref({ serviceType: "", zone: "", date: "" });

const serviceOptions = computed(() => buildServiceOptions(t));
const zoneOptions = computed(() => buildZoneOptions(t));

async function doSearch() {
  loading.value = true;
  try {
    const params = {};
    Object.entries(filters.value).forEach(([k, v]) => { if (v) params[k] = v; });
    events.value = await EventService.searchOpen(params);
  } finally {
    loading.value = false;
  }
}

onMounted(doSearch);
</script>

<style scoped>
.view-container { max-width: 1024px; margin: 0 auto; }
.view-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #1A2E4A; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-5 { margin-bottom: 1.25rem; }
.filters-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
@media (min-width: 640px) { .filters-grid { grid-template-columns: repeat(3, 1fr); } }
.loader-wrapper { display: flex; justify-content: center; padding: 4rem 0; }
.spinner-lg { width: 36px; height: 36px; }
.empty-state { text-align: center; padding: 4rem 0; }
.empty-icon { color: #7A8FA6; margin-bottom: 1rem; }
.empty-text { color: #3A4A5C; }
.event-list { display: flex; flex-direction: column; gap: 1rem; }
</style>
