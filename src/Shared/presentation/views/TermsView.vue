<template>
  <LegalDocumentView :src="`/docs/terms-${CURRENT_TERMS_VERSION}.md`" />
</template>

<script setup>
import LegalDocumentView from "../components/LegalDocumentView.vue";
import { CURRENT_TERMS_VERSION } from "../../domain/constants/terms.js";
</script>
