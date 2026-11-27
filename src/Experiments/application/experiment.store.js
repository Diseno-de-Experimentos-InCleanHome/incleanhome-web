/**
 * Store de experimentos (Pinia) — servicio de flags (US43).
 * Capa: Experiments / application
 *
 * - Carga GET /experiments/config una vez al iniciar la app.
 * - Mientras responde, o si falla, usa la última configuración válida guardada; sin ella,
 *   todo queda apagado y la web mantiene el comportamiento actual.
 * - Guarda la variante asignada a cada usuario la primera vez que la calcula con la
 *   configuración ya cargada, y la respeta mientras el experimento siga activo.
 */
import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { useAuthStore } from "../../IAM/application/auth.store.js";
import { parseExperimentConfig } from "../domain/model/experiment-config.value.js";
import { evaluateExperiment } from "../domain/services/experiment-assigner.js";
import { ExperimentApi } from "../infrastructure/experiment.api.js";
import { ExperimentStorage } from "../infrastructure/experiment.storage.js";

export const useExperimentStore = defineStore("experiments", () => {
  const settings = shallowRef(parseExperimentConfig(ExperimentStorage.getConfig()) ?? new Map());
  const isReady = ref(false);
  let loading = null;

  async function fetchConfig() {
    try {
      const response = await ExperimentApi.getConfig();
      const parsed = parseExperimentConfig(response);
      if (parsed) {
        settings.value = parsed;
        ExperimentStorage.setConfig(response);
      }
    } catch {
      // Sin respuesta del API se mantiene la caché (o todo apagado).
    } finally {
      isReady.value = true;
    }
  }

  /** Idempotente: todas las llamadas comparten la misma carga y la promesa nunca falla. */
  function load() {
    loading ??= fetchConfig();
    return loading;
  }

  function assignmentFor(experimentId, user = useAuthStore().user) {
    const hasUser = user?.id != null;
    const storedVariant = hasUser ? ExperimentStorage.getVariant(experimentId, user.id) : null;
    const result = evaluateExperiment({
      experimentId, setting: settings.value.get(experimentId), user, storedVariant,
    });
    // No se fija una variante calculada con una caché que aún puede estar desactualizada.
    if (isReady.value && hasUser && result.inExperiment && !storedVariant) {
      ExperimentStorage.setVariant(experimentId, user.id, result.variant);
    }
    return result;
  }

  return { isReady, load, assignmentFor };
});
