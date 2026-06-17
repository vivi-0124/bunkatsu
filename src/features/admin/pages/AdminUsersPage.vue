<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSnackbar } from '@/shared/composables/useSnackbar'

const users = ref<any[]>([])
const loading = ref(true)
const { success, error } = useSnackbar()

const headers = [
  { title: '名前', key: 'name' },
  { title: 'メールアドレス', key: 'email' },
  { title: 'ロール', key: 'role' },
]

async function fetchUsers() {
  loading.value = true
  try {
    const res = await fetch('/api/users')
    if (res.ok) {
      const data = await res.json()
      users.value = data
    }
  } catch (e) {
    error('ユーザー一覧の取得に失敗しました')
  } finally {
    loading.value = false
  }
}

async function updateRole(userId: string, role: string) {
  try {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    })
    
    if (res.ok) {
      success('権限を更新しました')
    } else {
      throw new Error('Update failed')
    }
  } catch (e) {
    error('権限の更新に失敗しました')
    await fetchUsers() // revert
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">ユーザー管理</h1>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" @click="fetchUsers" :loading="loading">
        更新
      </v-btn>
    </div>

    <v-card class="border rounded-xl" elevation="0">
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        hover
      >
        <template v-slot:item.role="{ item }">
          <v-select
            v-model="item.role"
            :items="['admin', 'user']"
            density="compact"
            variant="outlined"
            hide-details
            @update:modelValue="updateRole(item.id, $event)"
            style="width: 120px"
          ></v-select>
        </template>
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" color="primary" class="mr-3 text-caption">
              {{ item.name.charAt(0) }}
            </v-avatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
