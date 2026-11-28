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

  // Set when a worker login/registration comes back with membershipPending — read once
  // by MembershipPendingView and not persisted (there's no session to persist yet).
  const membershipMessage = ref(null);

  // US40: aviso que muestra el inicio de sesión (sesión cerrada o contraseña cambiada).
  const notice = ref(null);

  const isLoggedIn = computed(() => !!token.value && !!user.value);
  // US40: se guarda con el usuario para recordarlo al recargar.
  const passwordChangeRequired = computed(() => user.value?.passwordChangeRequired === true);

  function setAuth(userData, tokenData, { passwordChangeRequired: mustChange = false } = {}) {
    const sessionUser = mustChange ? { ...userData, passwordChangeRequired: true } : userData;
    user.value = sessionUser;
    token.value = tokenData;
    notice.value = null;
    AuthStorage.setUser(sessionUser);
    AuthStorage.setToken(tokenData);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${tokenData}`;
  }

  function setPasswordChangeRequired(value) {
    if (user.value && passwordChangeRequired.value !== value) updateUser({ passwordChangeRequired: value });
  }

  function setNotice(value) {
    notice.value = value;
  }

  /** La sesión venció o se cerró desde otro dispositivo. */
  function closeSession() {
    clearAuth();
    notice.value = "session_closed";
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

  function setMembershipPending(payload) {
    membershipMessage.value = payload;
  }

  function clearMembershipPending() {
    membershipMessage.value = null;
  }

  // On load, if a persisted token exists, we apply it to the HTTP client.
  if (token.value) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;
  }

  return {
    user, token, isLoggedIn, setAuth, clearAuth, updateUser,
    passwordChangeRequired, setPasswordChangeRequired, notice, setNotice, closeSession,
    challengeToken, setChallengeToken, clearChallengeToken,
    membershipMessage, setMembershipPending, clearMembershipPending,
  };
});
