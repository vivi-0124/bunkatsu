<script setup lang="ts">
import { useAuthStore } from '@/features/auth/stores/auth'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'

const authStore = useAuthStore()
const router = useRouter()
const theme = useTheme()
const drawer = ref(true)

const isDark = computed(() => theme.global.name.value === 'dark')

function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}

function handleLogout() {
  authStore.signOut()
}

const role = computed(() => authStore.session?.user?.role || 'user')

const navItems = computed(() => {
  if (role.value === 'admin') {
    return [
      { title: 'ユーザー管理', to: '/dashboard/admin/users', icon: 'mdi-account-group' }
    ]
  }
  return [
    { title: '分割払い', to: '/dashboard/fixed-costs', icon: 'mdi-credit-card-outline' },
    { title: '月別収支', to: '/dashboard/monthly', icon: 'mdi-receipt-text-outline' }
  ]
})
</script>

<template>
  <v-layout class="bg-background">
    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" border="none" elevation="1">
      <!-- Sidebar Header -->
      <div class="px-4 py-4 d-flex align-center">
        <div class="app-logo mr-3">
          <v-icon icon="mdi-wallet" color="white" size="20" />
        </div>
        <div>
          <div class="font-weight-bold text-body-1">分かつ</div>
          <div class="text-caption text-medium-emphasis text-capitalize">{{ role }}</div>
        </div>
      </div>

      <v-divider class="mb-2" />

      <!-- Navigation Links -->
      <v-list density="compact" nav class="px-3">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          color="primary"
          rounded="lg"
          class="mb-1"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-3">
          <v-list density="compact" nav class="pa-0 mb-2">
            <v-list-item
              @click="toggleTheme"
              :prepend-icon="isDark ? 'mdi-white-balance-sun' : 'mdi-moon-waning-crescent'"
              title="テーマ切替"
              rounded="lg"
            ></v-list-item>
          </v-list>
          
          <v-card variant="flat" color="surface" class="rounded-lg pa-3 d-flex align-center justify-space-between border">
            <div class="d-flex align-center overflow-hidden">
              <v-avatar size="32" color="primary" class="mr-3 text-caption">
                {{ authStore.session?.user?.name?.charAt(0) || 'U' }}
              </v-avatar>
              <div class="overflow-hidden">
                <div class="text-caption font-weight-bold text-truncate">{{ authStore.session?.user?.name }}</div>
                <div class="text-caption text-medium-emphasis text-truncate" style="font-size: 10px !important;">{{ authStore.session?.user?.email }}</div>
              </div>
            </div>
            <v-btn icon="mdi-logout" variant="text" size="small" color="error" @click="handleLogout" />
          </v-card>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-app-bar v-if="$vuetify.display.mdAndDown" elevation="1">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-app-bar-title>分かつ</v-app-bar-title>
      </v-app-bar>
      
      <div class="pa-4 pa-md-8 h-100">
        <RouterView />
      </div>
    </v-main>
  </v-layout>
</template>

<style scoped>
.app-logo {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}
</style>
