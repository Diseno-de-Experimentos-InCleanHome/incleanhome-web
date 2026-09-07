<template>
  <div class="view-container">
    <!-- Header -->
    <div class="search-header">
      <h1 class="page-title">{{ t('search.title') }}</h1>
      <p class="page-subtitle">{{ t('search.subtitle') }}</p>
    </div>

    <div class="search-layout">
      <!-- Filters sidebar -->
      <div class="filters-sidebar">
        <div class="card sticky-card">
          <div class="filters-header">
            <h3 class="filters-title">{{ t('search.filters') }}</h3>
            <button @click="clearFilters" class="link-btn">{{ t('search.clearFilters') }}</button>
          </div>
          <div class="filters-list">
            <div class="form-group">
              <label class="label">{{ t('search.serviceType') }}</label>
              <select v-model="filters.serviceType" class="input-field" @change="doSearch">
                <option value="">{{ t('search.allServices') }}</option>
                <option v-for="s in serviceOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">{{ t('search.zone') }}</label>
              <select v-model="filters.zone" class="input-field" @change="doSearch">
                <option value="">{{ t('search.allZones') }}</option>
                <option v-for="z in zoneOptions" :key="z.value" :value="z.value">{{ z.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">{{ t('search.gender') }}</label>
              <select v-model="filters.gender" class="input-field" @change="doSearch">
                <option value="">{{ t('search.allGenders') }}</option>
                <option value="female">{{ t('worker.female') }}</option>
                <option value="male">{{ t('worker.male') }}</option>
              </select>
            </div>
            <div class="grid-2-cols gap-small">
              <div class="form-group">
                <label class="label">{{ t('search.minAge') }}</label>
                <input v-model.number="filters.minAge" type="number" class="input-field" min="18" max="70" @input="doSearch" />
              </div>
              <div class="form-group">
                <label class="label">{{ t('search.maxAge') }}</label>
                <input v-model.number="filters.maxAge" type="number" class="input-field" min="18" max="70" @input="doSearch" />
              </div>
            </div>
            <div class="form-group">
              <label class="label">{{ t('search.maxHourlyRate') }}</label>
              <input v-model.number="filters.maxHourlyRate" type="number" class="input-field" min="10" step="5" @input="doSearch" />
            </div>
            <div class="form-group">
              <label class="label">{{ t('search.minRating') }}</label>
              <select v-model.number="filters.minRating" class="input-field" @change="doSearch">
                <option value="">-</option>
                <option value="4.5">4.5+</option>
                <option value="4">4+</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div class="results-area">
        <!-- Mobile filters toggle -->
        <div class="mobile-filters-toggle">
          <button @click="showFilters = !showFilters" class="btn btn-secondary btn-full toggle-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            {{ t('search.filters') }}
          </button>
          <div v-if="showFilters" class="card mt-3">
            <div class="filters-list-mobile">
              <select v-model="filters.serviceType" class="input-field" @change="doSearch"><option value="">{{ t('search.allServices') }}</option><option v-for="s in serviceOptions" :key="s.value" :value="s.value">{{ s.label }}</option></select>
              <select v-model="filters.zone" class="input-field" @change="doSearch"><option value="">{{ t('search.allZones') }}</option><option v-for="z in zoneOptions" :key="z.value" :value="z.value">{{ z.label }}</option></select>
              <select v-model="filters.gender" class="input-field" @change="doSearch"><option value="">{{ t('search.allGenders') }}</option><option value="female">{{ t('worker.female') }}</option><option value="male">{{ t('worker.male') }}</option></select>
            </div>
          </div>
        </div>

        <div class="results-header">
          <p class="results-meta"><span class="results-count">{{ workers.length }}</span> {{ t('search.results') }}</p>
        </div>

        <div v-if="loading" class="loader-wrapper">
          <div class="spinner spinner-lg"></div>
        </div>

        <div v-else-if="workers.length === 0" class="empty-state">
          <AppIcon name="emptyBox" :size="44" class="empty-icon" />
          <p class="empty-text">{{ t('search.noResults') }}</p>
        </div>

        <div v-else class="results-grid">
          <WorkerCard v-for="worker in workers" :key="worker.id" :worker="worker" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { CatalogService } from "../../application/catalog.service.js";
import { SearchFilters } from "../../domain/model/search-filters.value.js";
import { buildServiceOptions } from "../../../Shared/domain/constants/services.js";
import { buildZoneOptions } from "../../../Shared/domain/constants/zones.js";
import WorkerCard from "../components/WorkerCard.vue";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const workers = ref([]);
const loading = ref(true);
const showFilters = ref(false);
const filters = ref(SearchFilters.empty());

const serviceOptions = computed(() => buildServiceOptions(t));
const zoneOptions = computed(() => buildZoneOptions(t));

async function doSearch() {
  loading.value = true;
  try {
    workers.value = await CatalogService.search(filters.value.toParams());
  } catch { workers.value = []; }
  finally { loading.value = false; }
}

function clearFilters() {
  filters.value = SearchFilters.empty();
  doSearch();
}

onMounted(doSearch);
</script>

<style scoped>
.view-container {
  max-width: 1280px;
  margin: 0 auto;
}

.search-header { 
  margin-bottom: 1.5rem; 
}
.page-title { 
  font-size: 1.875rem; 
  font-weight: 800; 
  color: #1A2E4A; 
  margin-bottom: 0.25rem; 
}
.page-subtitle { 
  color: #3A4A5C; 
  font-size: 1rem;
}

.search-layout {
  display: flex;
  gap: 1.5rem;
}

.filters-sidebar {
  display: none;
  width: 260px;
  flex-shrink: 0;
}
@media (min-width: 1024px) {
  .filters-sidebar { display: block; }
}

.sticky-card {
  position: sticky;
  top: 6rem;
}

.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.filters-title { font-weight: 600; color: #1A2E4A; font-size: 1.125rem; }
.link-btn { font-size: 0.8125rem; color: #009960; background: none; border: none; cursor: pointer; }

.filters-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.grid-2-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.results-area {
  flex: 1;
}

.mobile-filters-toggle {
  margin-bottom: 1rem;
}
@media (min-width: 1024px) {
  .mobile-filters-toggle { display: none; }
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.mt-3 { margin-top: 0.75rem; }

.filters-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.results-meta { font-size: 0.9375rem; color: #3A4A5C; }
.results-count { font-weight: 600; color: #1A2E4A; margin-right: 0.25rem; }

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

.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .results-grid { grid-template-columns: repeat(2, 1fr); }
}

.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius:50%; width:28px; height:28px; animation: spin 1s linear infinite; }
.spinner-lg { width:36px; height:36px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
