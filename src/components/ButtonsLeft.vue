<template>
  <v-card>
    <div class="d-flex">
      <v-btn color="primary" class="mr-2">左1</v-btn>
      <v-btn color="primary" class="mr-2">左2</v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { inject } from "vue";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels } = useI18nHeadersLabels(selectedLanguage, fileName);
</script>

<style scoped></style>
