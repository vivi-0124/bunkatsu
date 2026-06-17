<script setup lang="ts">
import { ref } from 'vue'
import { useSnackbar } from '@/shared/composables/useSnackbar'
import { useMonthlyRecordsStore } from '../stores/monthlyRecords'

const props = defineProps<{
  month: string
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const { success, error } = useSnackbar()
const store = useMonthlyRecordsStore()

const tab = ref('payment')
const isSubmitting = ref(false)

const paymentForm = ref({
  name: '',
  amount: '',
  date: '',
  recurring: false
})

const incomeForm = ref({
  name: '',
  amount: '',
  date: '',
  recurring: false
})

function close() {
  emit('update:modelValue', false)
}

function resetForms() {
  paymentForm.value = { name: '', amount: '', date: '', recurring: false }
  incomeForm.value = { name: '', amount: '', date: '', recurring: false }
}

async function handleAddPayment() {
  if (!paymentForm.value.name) return
  isSubmitting.value = true
  
  try {
    const payload = {
      name: paymentForm.value.name,
      amount: paymentForm.value.amount ? Number(paymentForm.value.amount) : 0,
      paymentDate: paymentForm.value.date || null
    }
    await store.addPayment(payload, paymentForm.value.recurring)
    success(paymentForm.value.recurring ? '支出項目を追加しました（毎月繰り返し）' : '支出項目を追加しました')
    resetForms()
    emit('success')
    close()
  } catch (e) {
    error('追加に失敗しました')
  } finally {
    isSubmitting.value = false
  }
}

async function handleAddIncome() {
  if (!incomeForm.value.name) return
  isSubmitting.value = true
  
  try {
    const payload = {
      name: incomeForm.value.name,
      amount: incomeForm.value.amount ? Number(incomeForm.value.amount) : 0,
      date: incomeForm.value.date || null
    }
    await store.addIncome(payload, incomeForm.value.recurring)
    success(incomeForm.value.recurring ? '収入項目を追加しました（毎月繰り返し）' : '収入項目を追加しました')
    resetForms()
    emit('success')
    close()
  } catch (e) {
    error('追加に失敗しました')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <v-dialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)" max-width="500px">
    <v-card class="rounded-xl">
      <v-card-title class="pa-4 text-h6 font-weight-bold">
        項目を追加
      </v-card-title>
      <v-card-subtitle class="px-4">
        {{ month }} の明細に新しい項目を追加します。「毎月繰り返す」にチェックすると、翌月以降も自動的に追加されます。
      </v-card-subtitle>
      
      <v-card-text class="pa-4 pt-0 mt-4">
        <v-tabs v-model="tab" color="primary" class="mb-4">
          <v-tab value="payment" class="flex-1-0">支出</v-tab>
          <v-tab value="income" class="flex-1-0">収入</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- 支出 -->
          <v-window-item value="payment">
            <v-text-field v-model="paymentForm.name" label="項目名 *" variant="outlined" density="comfortable" class="mb-2" required></v-text-field>
            <v-text-field v-model="paymentForm.amount" label="金額（任意）" variant="outlined" density="comfortable" type="number" class="mb-2"></v-text-field>
            <v-text-field v-model="paymentForm.date" label="支払日（任意）" placeholder="例: 10/27" variant="outlined" density="comfortable" class="mb-2"></v-text-field>
            <v-checkbox v-model="paymentForm.recurring" label="毎月繰り返す" density="compact" hide-details class="mb-2"></v-checkbox>
            <v-btn color="primary" block variant="flat" size="large" @click="handleAddPayment" :disabled="!paymentForm.name || isSubmitting" :loading="isSubmitting">
              支出を追加
            </v-btn>
          </v-window-item>

          <!-- 収入 -->
          <v-window-item value="income">
            <v-text-field v-model="incomeForm.name" label="項目名 *" variant="outlined" density="comfortable" class="mb-2" required></v-text-field>
            <v-text-field v-model="incomeForm.amount" label="金額（任意）" variant="outlined" density="comfortable" type="number" class="mb-2"></v-text-field>
            <v-text-field v-model="incomeForm.date" label="日付（任意）" placeholder="例: 10/15" variant="outlined" density="comfortable" class="mb-2"></v-text-field>
            <v-checkbox v-model="incomeForm.recurring" label="毎月繰り返す" density="compact" hide-details class="mb-2"></v-checkbox>
            <v-btn color="primary" block variant="flat" size="large" @click="handleAddIncome" :disabled="!incomeForm.name || isSubmitting" :loading="isSubmitting">
              収入を追加
            </v-btn>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
