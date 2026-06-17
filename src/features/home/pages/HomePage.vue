<script setup lang="ts">
import { useAuthStore } from '@/features/auth/stores/auth'
import { useTheme } from 'vuetify'
import { ref } from 'vue'

const authStore = useAuthStore()
const theme = useTheme()

const isDark = ref(theme.global.name.value === 'dark')
const loginError = ref<string | null>(null)
const isLoggingIn = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  theme.global.name.value = isDark.value ? 'dark' : 'light'
}

async function handleLogin() {
  loginError.value = null
  isLoggingIn.value = true
  try {
    await authStore.signIn()
  } catch (e: any) {
    const msg = e?.message || e?.code || JSON.stringify(e)
    loginError.value = `ログインに失敗しました: ${msg}`
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<template>
  <div class="homepage-container" :class="{ 'theme-dark': isDark, 'theme-light': !isDark }">
    <v-app-bar elevation="0" color="transparent" class="px-4">
      <div class="d-flex align-center">
        <div class="logo-icon bg-gradient mr-2">
          <v-icon icon="mdi-wallet" color="white" />
        </div>
        <span class="text-h6 font-weight-bold">分かつ</span>
      </div>
      <v-spacer />
      <v-btn icon @click="toggleTheme" class="mr-2">
        <v-icon :icon="isDark ? 'mdi-white-balance-sun' : 'mdi-moon-waning-crescent'" />
      </v-btn>
      <v-btn
        v-if="!authStore.isPending && !authStore.session"
        color="primary"
        variant="flat"
        @click="handleLogin"
        :loading="isLoggingIn"
        :disabled="isLoggingIn"
        class="text-none font-weight-medium px-6 rounded-pill"
      >
        ログイン
      </v-btn>
      <v-btn
        v-if="authStore.session"
        color="primary"
        variant="flat"
        to="/dashboard"
        class="text-none font-weight-medium px-6 rounded-pill"
      >
        ダッシュボードへ
      </v-btn>
    </v-app-bar>

    <main>
      <!-- Hero Section -->
      <section class="hero-section text-center py-16 px-4">
        <div class="glow-effect"></div>
        <h1 class="text-h2 font-weight-bold mb-6 text-gradient">
          固定費と分割払いを<br />スマートに管理
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-10 max-w-2xl mx-auto">
          毎月の支払いや、複数回に分けた支払いを一元管理。
          いつ、いくら支払う必要があるのかを可視化し、計画的な支出管理をサポートします。
        </p>
        <div class="d-flex justify-center gap-4 flex-wrap">
          <v-btn
            color="primary"
            size="x-large"
            variant="flat"
            @click="handleLogin"
            :loading="isLoggingIn"
            :disabled="isLoggingIn"
            class="rounded-pill px-8"
          >
            無料で始める
            <v-icon icon="mdi-arrow-right" class="ml-2" />
          </v-btn>
        </div>
        <v-alert
          v-if="loginError"
          type="error"
          variant="tonal"
          class="mt-4 mx-auto"
          style="max-width: 400px"
          closable
          @click:close="loginError = null"
        >
          {{ loginError }}
        </v-alert>
      </section>

      <!-- Features Section -->
      <section class="py-16 px-4 bg-surface-variant-opacity">
        <v-container>
          <div class="text-center mb-12">
            <h2 class="text-h4 font-weight-bold mb-4">できること</h2>
            <p class="text-medium-emphasis">シンプルで直感的な機能を提供します</p>
          </div>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100 rounded-xl pa-6 border-opacity-50">
                <div class="feature-icon-wrapper mb-4">
                  <v-icon icon="mdi-calendar-check" color="primary" size="32" />
                </div>
                <h3 class="text-h6 font-weight-bold mb-2">スケジュール管理</h3>
                <p class="text-medium-emphasis">支払いの開始月から完了予定月までを自動計算。いつ支払いが終わるのかが一目でわかります。</p>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100 rounded-xl pa-6 border-opacity-50">
                <div class="feature-icon-wrapper mb-4">
                  <v-icon icon="mdi-chart-donut" color="primary" size="32" />
                </div>
                <h3 class="text-h6 font-weight-bold mb-2">支払い状況の可視化</h3>
                <p class="text-medium-emphasis">全体の支払い進捗をプログレスバーで表示。残りの支払い額も自動で計算されます。</p>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>
    </main>
  </div>
</template>

<style scoped>
.homepage-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-gradient {
  background: linear-gradient(135deg, #6366f1, #a855f7);
}

.text-gradient {
  background: linear-gradient(to right, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.theme-dark .text-gradient {
  background: linear-gradient(to right, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-section {
  position: relative;
  padding-top: 120px !important;
  padding-bottom: 80px !important;
}

.glow-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0) 70%);
  z-index: 0;
  pointer-events: none;
}

.theme-dark .glow-effect {
  background: radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, rgba(192, 132, 252, 0) 70%);
}

.max-w-2xl {
  max-width: 42rem;
}

.feature-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-surface-variant-opacity {
  background-color: rgba(var(--v-theme-surface), 0.5);
}
</style>
