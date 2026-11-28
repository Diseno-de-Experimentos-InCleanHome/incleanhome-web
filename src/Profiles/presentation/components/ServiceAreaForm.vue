<template>
  <section v-if="status !== ServiceAreaStatus.UNAVAILABLE" class="card service-area-card" data-test="service-area">
    <h2 class="section-title"><AppIcon name="pin" :size="18" /> {{ t('serviceArea.title') }}</h2>
    <p class="intro">{{ t('serviceArea.intro') }}</p>

    <div v-if="loading" class="intro" role="status">{{ t('common.loading') }}</div>

    <div v-else-if="loadFailed" class="alert error-box" role="alert">
      <span>{{ t('serviceArea.loadError') }}</span>
      <button type="button" class="btn btn-secondary btn-sm" data-test="service-area-retry" @click="load">
        {{ t('serviceArea.retry') }}
      </button>
    </div>

    <form v-else class="area-form" novalidate @submit.prevent="save">
      <p v-if="status === ServiceAreaStatus.EMPTY" class="notice" data-test="service-area-empty">
        {{ t('serviceArea.empty') }}
      </p>

      <div class="fields">
        <div class="form-group">
          <label class="label-bold" for="service-district">{{ t('serviceArea.district') }}</label>
          <select id="service-district" v-model="form.district"
            :class="['input-field', { 'input-error': errors.district }]" @change="changed('district')">
            <option value="" disabled>{{ t('serviceArea.selectDistrict') }}</option>
            <option v-for="d in DISTRICTS" :key="d.key" :value="d.key">{{ d.name }}</option>
          </select>
          <p v-if="errors.district" class="field-error" role="alert">{{ errors.district }}</p>
        </div>

        <div class="form-group">
          <label class="label-bold" for="service-radius">{{ t('serviceArea.radius') }}</label>
          <input id="service-radius" v-model="form.radiusKm" type="number" step="1" inputmode="numeric"
            :min="RADIUS_MIN" :max="RADIUS_MAX" :class="['input-field', { 'input-error': errors.radiusKm }]"
            @input="saved = false" @blur="touch('radiusKm')" />
          <p v-if="errors.radiusKm" class="field-error" role="alert">{{ errors.radiusKm }}</p>
          <p v-else class="hint">{{ t('serviceArea.radiusHint', range) }}</p>
        </div>
      </div>

      <p class="hint">{{ t('serviceArea.privacy') }}</p>

      <div v-if="saved" class="alert success-box" role="status">
        <AppIcon name="check" :size="15" /> {{ t('serviceArea.saved') }}
      </div>
      <div v-if="saveError" class="alert error-box" role="alert">{{ saveError }}</div>

      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? t('common.loading') : t('serviceArea.save') }}
      </button>
    </form>
  </section>
</template>

<script setup>
/**
 * US32 — distrito base y radio de atención del prestador/a. La vista solo lo monta con
 * EC-BLQ01-SA activo; si el API responde 403, no muestra nada.
 */
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ServiceAreaService, ServiceAreaStatus } from "../../application/service-area.service.js";
import { RADIUS_MAX, RADIUS_MIN, isValidRadius } from "../../domain/model/service-area.value.js";
import { DISTRICTS, isDistrict } from "../../../Shared/domain/constants/districts.js";
import { useFormValidation } from "../../../Shared/presentation/composables/useFormValidation.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

const { t } = useI18n();
const range = { min: RADIUS_MIN, max: RADIUS_MAX };

const status = ref(null);
const loading = ref(true);
const loadFailed = ref(false);
const saving = ref(false);
const saved = ref(false);
const saveError = ref("");
const form = ref({ district: "", radiusKm: "" });

const schema = computed(() => ({
  district: [(value) => (isDistrict(value) ? null : t("serviceArea.districtRequired"))],
  radiusKm: [(value) => (isValidRadius(value) ? null : t("serviceArea.radiusRange", range))],
}));
const { errors, touch, validateAll } = useFormValidation(form, schema);

function changed(field) {
  saved.value = false;
  touch(field);
}

function fill(area) {
  form.value = { district: area.district, radiusKm: area.radiusKm };
}

async function load() {
  loading.value = true;
  loadFailed.value = false;
  try {
    const result = await ServiceAreaService.load();
    status.value = result.status;
    if (result.area) fill(result.area);
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

async function save() {
  saved.value = false;
  saveError.value = "";
  if (saving.value || !validateAll()) return;
  saving.value = true;
  try {
    fill(await ServiceAreaService.save({ district: form.value.district, radiusKm: Number(form.value.radiusKm) }));
    status.value = ServiceAreaStatus.SAVED;
    saved.value = true;
  } catch (error) {
    const response = error?.response;
    if (response?.status === 403) status.value = ServiceAreaStatus.UNAVAILABLE;
    else if (response?.data?.validDistricts) saveError.value = t("serviceArea.unknownDistrict");
    // El 400 del radio explica el rango que tiene configurado el servidor.
    else saveError.value = response?.data?.error || t("common.error");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.service-area-card { max-width: 896px; margin: 1.5rem auto 0; padding: 2rem; }
@media (min-width: 640px) { .service-area-card { padding: 2rem 3rem; } }
.section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 700; color: #1A2E4A; }
.intro { color: #3A4A5C; font-size: 0.9375rem; margin: 0.5rem 0 1rem; }
.notice { background: #FFF7E6; color: #7A5C10; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }
.area-form { display: flex; flex-direction: column; gap: 1rem; align-items: stretch; }
.fields { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 640px) { .fields { grid-template-columns: 2fr 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.label-bold { font-size: 0.8125rem; font-weight: 600; color: #3A4A5C; }
.hint { font-size: 0.75rem; color: #3A4A5C; margin: 0; }
.alert { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }
.success-box { justify-content: flex-start; background: #E6F9F2; color: #009960; }
.error-box { background: #fee2e2; color: #991b1b; }
</style>
