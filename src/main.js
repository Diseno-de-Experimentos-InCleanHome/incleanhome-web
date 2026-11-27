/**
 * Punto de entrada de la aplicación.
 * Capa: raíz
 *
 * Registra los plugins globales de Vue (Pinia, Router, i18n)
 * e inicializa la app. Los bounded contexts no se importan
 * aquí directamente — el router hace el lazy loading.
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router.js";
import i18n from "./Shared/infrastructure/i18n/i18n.js";
import { useExperimentStore } from "./Experiments/application/experiment.store.js";
import { TrackingService } from "./Tracking/application/tracking.service.js";
import "./style.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
// La configuración de experimentos se pide al iniciar; las vistas no esperan por ella.
useExperimentStore(pinia).load();
TrackingService.start();
app.use(router);
app.use(i18n);
app.mount("#app");
