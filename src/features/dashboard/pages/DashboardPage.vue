<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { onMounted } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  const role = authStore.session?.user?.role || 'user'
  if (role === 'admin') {
    router.replace('/dashboard/admin/users')
  } else {
    router.replace('/dashboard/fixed-costs')
  }
})
</script>

<template>
  <div class="d-flex justify-center align-center h-100">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </div>
</template>
