/**
 * Almacenamiento local de experimentos: caché de la configuración y variante asignada.
 * Capa: Experiments / infrastructure
 *
 * Son datos del navegador y sobreviven al cierre de sesión. Si el almacenamiento no está
 * disponible, la app sigue funcionando sin ellos.
 */
const CONFIG_KEY = "inclean_experiments_config";
const variantKey = (experimentId, userId) => `inclean_variant.${experimentId}.${userId}`;

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function write(key, value) {
  try { localStorage.setItem(key, value); } catch { /* almacenamiento lleno o bloqueado */ }
}

export const ExperimentStorage = {
  /** Última respuesta válida del API, tal como llegó; null si no hay o está dañada. */
  getConfig() {
    try { return JSON.parse(read(CONFIG_KEY)); } catch { return null; }
  },
  setConfig(response) {
    write(CONFIG_KEY, JSON.stringify(response));
  },
  getVariant(experimentId, userId) {
    return read(variantKey(experimentId, userId));
  },
  setVariant(experimentId, userId, variant) {
    write(variantKey(experimentId, userId), variant);
  },
};
