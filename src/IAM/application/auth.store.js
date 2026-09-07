/**
 * Auth store (Pinia).
 * Layer: IAM / application
 *
 * Maintains the current session state (user + token) and exposes
 * actions to log in/log out. Persistence is delegated to
 * `AuthStorage` (infrastructure); localStorage is not accessed here.
 *
 * This store is consumed by the router, the layouts (Shared) and
 * various views from other contexts. It is the "public API" of IAM.
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiClient from "../../Shared/infrastructure/http/api.client.js";
import { AuthStorage } from "../../Shared/infrastructure/storage/auth.storage.js";

export const useAuthStore = defineStore("auth", () => {
  // We restore the session from storage.
  const user = ref(AuthStorage.getUser());
  const token = ref(AuthStorage.getToken());

  // Short-lived challenge token (terms re-acceptance, 2FA). Kept in memory only —
  // it must never be persisted like the real session token.
  const challengeToken = ref(null);

  const isLoggedIn = computed(() => !!token.value && !!user.value);

  function setAuth(userData, tokenData) {
    user.value = userData;
    token.value = tokenData;
    AuthStorage.setUser(userData);
    AuthStorage.setToken(tokenData);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${tokenData}`;
  }

  function clearAuth() {
    user.value = null;
    token.value = null;
    AuthStorage.clear();
    delete apiClient.defaults.headers.common["Authorization"];
  }

  function updateUser(partial) {
    const merged = { ...user.value, ...partial };
    user.value = merged;
    AuthStorage.setUser(merged);
  }

  function setChallengeToken(value) {
    challengeToken.value = value;
  }

  function clearChallengeToken() {
    challengeToken.value = null;
  }

  // On load, if a persisted token exists, we apply it to the HTTP client.
  if (token.value) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;
  }

  return {
    user, token, isLoggedIn, setAuth, clearAuth, updateUser,
    challengeToken, setChallengeToken, clearChallengeToken,
  };
});
