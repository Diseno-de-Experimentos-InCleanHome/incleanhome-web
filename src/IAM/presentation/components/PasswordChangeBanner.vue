<template>
  <div v-if="visible" class="password-banner" role="alert" data-test="password-banner">
    <span>{{ t('security.changeRequired') }}</span>
    <router-link :to="`${roleAccountPath(auth.user?.role)}/password`" class="btn btn-primary btn-sm">
      {{ t('security.changePassword') }}
    </router-link>
  </div>
</template>

<script setup>
/** US40 — recuerda que hay un cambio de contraseña pendiente. */
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../application/auth.store.js";
import { roleAccountPath } from "../../../Shared/domain/constants/roles.js";

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();
// En la propia pantalla del cambio el aviso sobra.
const visible = computed(() => auth.passwordChangeRequired && !route.path?.endsWith("/account/password"));
</script>

<style scoped>
.password-banner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; background: #FFF7E6; border: 1px solid #F5C453; color: #7A5C10; border-radius: 0.75rem; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.9375rem; }
</style>
