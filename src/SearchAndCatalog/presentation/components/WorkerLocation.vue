<template>
  <div class="worker-location">
    <div class="info-row" data-test="service-district">
      <AppIcon name="pin" :size="16" />
      <span>{{ t('serviceArea.baseDistrict', { district: districtName(serviceDistrict) }) }}</span>
    </div>
    <div v-if="distanceKm !== null" class="info-row" data-test="approx-distance">
      <AppIcon name="pin" :size="16" />
      <span>{{ distanceKm === 0 ? t('serviceArea.sameDistrict') : t('serviceArea.distance', { km: distanceKm }) }}</span>
    </div>
    <label class="district-label">
      {{ t('serviceArea.yourDistrict') }}
      <select :value="district" class="input-field" data-test="client-district"
        @change="$emit('update:district', $event.target.value)">
        <option value="" disabled>{{ t('serviceArea.selectDistrict') }}</option>
        <option v-for="d in DISTRICTS" :key="d.key" :value="d.key">{{ d.name }}</option>
      </select>
    </label>
  </div>
</template>

<script setup>
/** US32 — distrito base del prestador/a y distancia aproximada; nunca una ubicación exacta. */
import { useI18n } from "vue-i18n";
import { DISTRICTS, districtName } from "../../../Shared/domain/constants/districts.js";
import AppIcon from "../../../Shared/presentation/components/AppIcon.vue";

defineProps({
  serviceDistrict: { type: String, required: true },
  distanceKm: { type: Number, default: null },
  /** Distrito del cliente; vacío si todavía no lo eligió. */
  district: { type: String, default: "" },
});
defineEmits(["update:district"]);

const { t } = useI18n();
</script>

<style scoped>
.info-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #3A4A5C; margin-bottom: 0.5rem; }
.district-label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; color: #3A4A5C; margin-top: 0.75rem; }
</style>
