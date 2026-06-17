<script setup lang="ts">
// Basic Admin Dashboard
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">管理者ダッシュボード</h1>
    <v-row>
      <v-col cols="12" md="4">
        <v-card to="/dashboard/admin/users" class="h-100">
          <v-card-title>
            <v-icon icon="mdi-account-group" class="mr-2" color="primary" />
            ユーザー管理
          </v-card-title>
          <v-card-text>
            登録ユーザーの一覧表示、権限の変更などを行います。
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
