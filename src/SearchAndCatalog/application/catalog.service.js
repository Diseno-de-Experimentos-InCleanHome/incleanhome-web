/**
 * Servicio de aplicación del catálogo.
 * Capa: SearchAndCatalog / application
 */
import { CatalogApi } from "../infrastructure/catalog.api.js";
import { WorkerCatalogItem } from "../domain/model/worker-catalog-item.entity.js";

export const CatalogService = {
  async search(filters = {}) {
    const raw = await CatalogApi.search(filters);
    return raw.map(WorkerCatalogItem.fromApi);
  },

  /** `district` (del cliente) es opcional: con él el API agrega la distancia aproximada. */
  async getWorker(id, { district } = {}) {
    const raw = await CatalogApi.getById(id, { district });
    return WorkerCatalogItem.fromApi(raw);
  },

  async getWorkerAvailability(workerId) {
    return CatalogApi.getAvailability(workerId);
  },
};
