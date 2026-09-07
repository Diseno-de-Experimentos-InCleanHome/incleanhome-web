<template>
  <div class="legal-view">
    <div class="legal-container">
      <router-link to="/login" class="back-link">← {{ t('common.back') }}</router-link>
      <div v-if="loading" class="loader-wrapper"><div class="spinner"></div></div>
      <div v-else class="legal-content" v-html="html"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { marked } from "marked";

const props = defineProps({ src: { type: String, required: true } });

const { t } = useI18n();
const html = ref("");
const loading = ref(true);

onMounted(async () => {
  const res = await fetch(props.src);
  const markdown = await res.text();
  html.value = marked.parse(markdown);
  loading.value = false;
});
</script>

<style scoped>
.legal-view { min-height: 100vh; background: #E6F9F2; padding: 2rem 1rem; }
.legal-container { max-width: 768px; margin: 0 auto; background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
.back-link { display: inline-block; margin-bottom: 1.5rem; color: #009960; font-weight: 600; text-decoration: none; font-size: 0.9375rem; }
.back-link:hover { text-decoration: underline; }
.loader-wrapper { display: flex; justify-content: center; padding: 3rem 0; }
.spinner { border: 3px solid rgba(0,0,0,0.08); border-top-color: #009960; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.legal-content :deep(h1) { font-size: 1.75rem; font-weight: 800; color: #1A2E4A; margin-bottom: 1.5rem; }
.legal-content :deep(h2) { font-size: 1.25rem; font-weight: 700; color: #1A2E4A; margin-top: 2rem; margin-bottom: 0.75rem; }
.legal-content :deep(p) { color: #3A4A5C; line-height: 1.7; margin-bottom: 1rem; }
.legal-content :deep(ul) { color: #3A4A5C; line-height: 1.7; margin-bottom: 1rem; padding-left: 1.5rem; }
.legal-content :deep(li) { margin-bottom: 0.375rem; }
.legal-content :deep(a) { color: #009960; }
.legal-content :deep(strong) { color: #1A2E4A; }
</style>
