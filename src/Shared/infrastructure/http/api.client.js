/**
 * Cliente HTTP central (axios).
 * Capa: Shared / infrastructure / http
 *
 * Esta es la ÚNICA instancia de axios de la app. Todos los archivos
 * *.api.js de cada bounded context la importan desde aquí.
 *
 * Configura:
 *   - baseURL desde VITE_API_BASE_URL (o "/api")
 *   - Authorization Bearer si hay token en localStorage
 */
import axios from "axios";
import { AuthStorage } from "../storage/auth.storage.js";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// Interceptor: agrega el token en cada request si existe
apiClient.interceptors.request.use((config) => {
  const token = AuthStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
