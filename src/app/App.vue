<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
</script>

<template>
  <v-app>
    <RouterView />
    <AppSnackbar />
  </v-app>
</template>
