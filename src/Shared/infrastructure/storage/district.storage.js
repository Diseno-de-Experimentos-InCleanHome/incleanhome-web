/**
 * Último distrito que eligió un cliente en este navegador, para no pedírselo cada vez.
 * Capa: Shared / infrastructure / storage
 *
 * Es solo una comodidad: si el almacenamiento no está disponible, se vuelve a elegir.
 */
import { isDistrict } from "../../domain/constants/districts.js";

const key = (userId) => `inclean_district.${userId}`;

export const DistrictStorage = {
  /** Clave del distrito, o "" si no hay una válida. */
  get(userId) {
    try {
      const value = localStorage.getItem(key(userId));
      return isDistrict(value) ? value : "";
    } catch {
      return "";
    }
  },
  set(userId, district) {
    try {
      if (isDistrict(district)) localStorage.setItem(key(userId), district);
    } catch { /* almacenamiento lleno o bloqueado */ }
  },
};
