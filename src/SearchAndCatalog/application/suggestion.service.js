/**
 * Servicio de aplicación de sugerencias (US33).
 * Capa: SearchAndCatalog / application
 */
import { SuggestionApi } from "../infrastructure/suggestion.api.js";
import { WorkerCatalogItem } from "../domain/model/worker-catalog-item.entity.js";

export const SuggestionService = {
  /** Respeta el orden del API: cercanía y después calificación. */
  async suggest(request) {
    const raw = await SuggestionApi.list(request);
    return raw.map(WorkerCatalogItem.fromApi);
  },
};
