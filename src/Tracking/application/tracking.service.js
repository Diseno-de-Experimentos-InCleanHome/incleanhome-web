/**
 * Servicio de aplicación de tracking: lo único que usan las vistas (US42).
 * Capa: Tracking / application
 *
 * Completa cada evento con el usuario de la sesión y, si pertenece a un experimento, con la
 * asignación vigente. El tracking nunca interrumpe el flujo del usuario.
 */
import { watch } from "vue";
import { useAuthStore } from "../../IAM/application/auth.store.js";
import { useExperimentStore } from "../../Experiments/application/experiment.store.js";
import { AuthStorage } from "../../Shared/infrastructure/storage/auth.storage.js";
import { TrackingApi } from "../infrastructure/tracking.api.js";
import { TrackingStorage } from "../infrastructure/tracking.storage.js";
import { TrackingEventName } from "../domain/model/tracking-plan.js";
import { EventTracker } from "./event-tracker.js";

const tracker = new EventTracker({
  storage: TrackingStorage,
  api: TrackingApi,
  getToken: () => AuthStorage.getToken(),
  environment: import.meta.env.MODE,
});

function safely(action) {
  try {
    return action();
  } catch (error) {
    console.warn("No se pudo registrar un evento de tracking", error);
    return undefined;
  }
}

export const TrackingService = {
  /**
   * @param {string} eventName evento del plan
   * @param {object} properties solo se conservan las que el plan permite
   * @param {object} [options]
   * @param {string} [options.operationKey] identifica la operación para no registrarla dos veces
   * @param {string} [options.experimentId] experimento al que pertenece el evento
   */
  track(eventName, properties = {}, { operationKey, experimentId } = {}) {
    safely(() => {
      const user = useAuthStore().user;
      const occurredAt = new Date().toISOString();
      const record = (assignment) => safely(() =>
        tracker.record({ eventName, properties, user, assignment, operationKey, occurredAt }));

      if (!experimentId) {
        record();
        return;
      }
      const experiments = useExperimentStore();
      const recordAssigned = () => record(experiments.assignmentFor(experimentId, user));
      // La asignación solo es definitiva cuando la configuración terminó de cargar.
      if (experiments.isReady) recordAssigned();
      else experiments.load().then(recordAssigned);
    });
  },

  /**
   * Registra experiment_exposure la primera vez que un usuario de una prueba A/B llega al
   * punto donde se mostraría la funcionalidad, esté en control o en tratamiento.
   */
  recordExposure(experimentId, location) {
    safely(() => {
      const user = useAuthStore().user;
      const experiments = useExperimentStore();
      experiments.load().then(() => safely(() => {
        const assignment = experiments.assignmentFor(experimentId, user);
        if (!assignment.inExperiment || user?.id == null) return;
        const flag = `exposure.${experimentId}.${user.id}`;
        if (TrackingStorage.hasFlag(flag)) return;
        tracker.record({
          eventName: TrackingEventName.EXPERIMENT_EXPOSURE,
          properties: { location },
          user,
          assignment,
          operationKey: `exposure:${experimentId}`,
        });
        TrackingStorage.setFlag(flag);
      }));
    });
  },

  flush: () => tracker.flush(),

  /** Se llama una vez al iniciar la app: envía lo pendiente y reintenta cuando puede. */
  start() {
    const auth = useAuthStore();
    watch(() => auth.token, (token) => { if (token) tracker.flush(); }, { immediate: true });
    window.addEventListener("online", () => tracker.flush());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") tracker.flush();
    });
  },
};
