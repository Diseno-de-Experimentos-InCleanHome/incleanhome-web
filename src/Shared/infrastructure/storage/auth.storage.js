/**
 * Adaptador de almacenamiento local para credenciales de auth.
 * Capa: Shared / infrastructure / storage
 *
 * Encapsula localStorage para que el resto de la app no dependa
 * directamente de la API del navegador. Si mañana cambias a
 * sessionStorage, cookies o IndexedDB, solo tocas este archivo.
 */
const TOKEN_KEY = "inclean_token";
const USER_KEY = "inclean_user";
const LANG_KEY = "inclean_lang";

export const AuthStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getLang() {
    return localStorage.getItem(LANG_KEY);
  },
  setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
  },
};
