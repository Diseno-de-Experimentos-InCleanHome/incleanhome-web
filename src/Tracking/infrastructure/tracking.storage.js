/**
 * Cola local de eventos y claves de operaciones ya registradas.
 * Capa: Tracking / infrastructure
 *
 * Se lee y escribe en localStorage en cada operación para no pisar lo que guarde otra pestaña.
 * Si el almacenamiento no está disponible, la cola vive en memoria hasta recargar la página.
 */
const OUTBOX_KEY = "inclean_tracking_outbox";
const KEYS_KEY = "inclean_tracking_keys";
const FLAG_PREFIX = "inclean_tracking_flag.";

const memory = new Map();

function read(key) {
  if (memory.has(key)) return memory.get(key);
  try { return localStorage.getItem(key); } catch { return null; }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    memory.set(key, value);
  }
}

function readList(key) {
  try {
    const list = JSON.parse(read(key));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export const TrackingStorage = {
  getOutbox: () => readList(OUTBOX_KEY),
  setOutbox: (events) => write(OUTBOX_KEY, JSON.stringify(events)),
  getOperationKeys: () => readList(KEYS_KEY),
  setOperationKeys: (keys) => write(KEYS_KEY, JSON.stringify(keys)),
  /** Marcas sin caducidad, para hechos que se registran una sola vez por usuario. */
  hasFlag: (name) => read(FLAG_PREFIX + name) !== null,
  setFlag: (name) => write(FLAG_PREFIX + name, "1"),
};
