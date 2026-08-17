<script setup lang="ts">
import { useAuthStore } from '@/features/auth/stores/auth'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useTheme, useDisplay } from 'vuetify'

const authStore = useAuthStore()
const router = useRouter()
const theme = useTheme()
const { mobile } = useDisplay()
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
  <!-- Desktop Navigation Drawer -->
  <v-navigation-drawer
    v-if="!mobile"
    v-model="drawer"
    border="none"
    elevation="1"
  >
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

    <!-- Mobile Top App Bar -->
    <v-app-bar v-if="mobile" elevation="1" density="comfortable">
      <div class="d-flex align-center px-3">
        <div class="app-logo mr-2" style="width: 28px; height: 28px;">
          <v-icon icon="mdi-wallet" color="white" size="16" />
        </div>
        <v-app-bar-title class="text-subtitle-1 font-weight-bold">分かつ</v-app-bar-title>
      </div>

      <v-spacer></v-spacer>

      <v-btn
        icon
        size="small"
        variant="text"
        @click="toggleTheme"
        class="mr-1"
      >
        <v-icon :icon="isDark ? 'mdi-white-balance-sun' : 'mdi-moon-waning-crescent'" size="20" />
      </v-btn>

      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn icon size="small" v-bind="props" class="mr-2">
            <v-avatar size="28" color="primary" class="text-caption">
              {{ authStore.session?.user?.name?.charAt(0) || 'U' }}
            </v-avatar>
          </v-btn>
        </template>
        <v-card min-width="200" class="pa-2 rounded-lg" elevation="3">
          <div class="px-3 py-2">
            <div class="text-body-2 font-weight-bold text-truncate">{{ authStore.session?.user?.name }}</div>
            <div class="text-caption text-medium-emphasis text-truncate">{{ authStore.session?.user?.email }}</div>
          </div>
          <v-divider class="my-1"></v-divider>
          <v-list density="compact" nav class="pa-0">
            <v-list-item
              prepend-icon="mdi-logout"
              title="ログアウト"
              color="error"
              class="text-error"
              rounded="lg"
              @click="handleLogout"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Mobile Bottom Navigation -->
    <v-bottom-navigation
      v-if="mobile"
      grow
      color="primary"
      elevation="4"
    >
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
      >
        <v-icon :icon="item.icon"></v-icon>
        <span class="text-caption font-weight-medium">{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Main Content -->
    <v-main class="bg-background">
      <div class="pa-4 pa-md-8 h-100">
        <RouterView />
      </div>
    </v-main>
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
