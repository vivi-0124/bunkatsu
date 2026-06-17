<script setup lang="ts">
import { useSnackbar } from '@/shared/composables/useSnackbar'

const { show, message, color } = useSnackbar()
</script>

<template>
  <v-snackbar
    v-model="show"
    :color="color"
    timeout="3000"
    location="top"
  >
    {{ message }}
    <template v-slot:actions>
      <v-btn variant="text" @click="show = false">閉じる</v-btn>
    </template>
  </v-snackbar>
</template>
