<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSnackbar } from '@/shared/composables/useSnackbar'
import AddRecordDialog from '../components/AddRecordDialog.vue'
import { useMonthlyRecords } from '../composables/useMonthlyRecords'

const { success, error } = useSnackbar()

const {
  records,
  loading,
  currentMonth,
  displayMonth,
  totalIncome,
  totalPayment,
  remainingPayment,
  balance,
  balanceProgress,
  initMonth,
  fetchRecords,
  prevMonth: goPrevMonth,
  nextMonth: goNextMonth,
  addPayment,
  addIncome,
  updatePayment,
  updateIncome,
  deleteRecord,
  togglePaid,
  generateRecurring,
  bulkSetPaid,
  bulkDelete,
  importCsv,
  downloadTemplate,
  exportCsv,
} = useMonthlyRecords()

// State
const selectedPayments = ref<string[]>([])
const selectedIncomes = ref<string[]>([])
const hasSelectedItems = computed(() => selectedPayments.value.length > 0 || selectedIncomes.value.length > 0)

// Dialogs
const addDialog = ref(false)
const importDialog = ref(false)
const importFile = ref<File | null>(null)
const isImporting = ref(false)

// Edit Dialogs
const editPaymentDialog = ref(false)
const editIncomeDialog = ref(false)
const editPaymentForm = ref<any>({})
const editIncomeForm = ref<any>({})

// Delete/Save Targets
const deleteTarget = ref<any>(null)
const saveTarget = ref<any>(null)

// Initialize
onMounted(() => {
  initMonth()
  fetchRecords().catch(() => error('データの取得に失敗しました'))
})

function prevMonth() {
  goPrevMonth()
}

function nextMonth() {
  goNextMonth()
}

const paymentHeaders = [
  { title: '項目名', key: 'name' },
  { title: '金額', key: 'amount' },
  { title: '支払日', key: 'paymentDate' },
]

const incomeHeaders = [
  { title: '項目名', key: 'name' },
  { title: '金額', key: 'amount' },
  { title: '日付', key: 'date' },
]

// Actions
function openEditPayment(item: any) {
  editPaymentForm.value = { ...item, amount: item.amount.toString() }
  editPaymentDialog.value = true
}

function openEditIncome(item: any) {
  editIncomeForm.value = { ...item, amount: item.amount.toString() }
  editIncomeDialog.value = true
}

async function handleEditPaymentSubmit(scope: 'this_month' | 'all_future') {
  try {
    const payload = {
      name: editPaymentForm.value.name,
      amount: Number(editPaymentForm.value.amount),
      paymentDate: editPaymentForm.value.paymentDate || null,
      isPaid: editPaymentForm.value.isPaid,
      scope
    }
    await updatePayment(editPaymentForm.value.id, payload)
    success('更新しました')
    editPaymentDialog.value = false
    saveTarget.value = null
  } catch (e) {
    error('更新に失敗しました')
  }
}

async function handleEditIncomeSubmit(scope: 'this_month' | 'all_future' = 'this_month') {
  try {
    const payload = {
      name: editIncomeForm.value.name,
      amount: Number(editIncomeForm.value.amount),
      date: editIncomeForm.value.date || null,
      scope
    }
    await updateIncome(editIncomeForm.value.id, payload)
    success('更新しました')
    editIncomeDialog.value = false
  } catch (e) {
    error('更新に失敗しました')
  }
}

async function executeDelete(scope: 'this_month' | 'all_future' = 'this_month') {
  if (!deleteTarget.value) return

  try {
    const { id, type } = deleteTarget.value
    await deleteRecord(id, type, scope)
    success('削除しました')
    editPaymentDialog.value = false
    editIncomeDialog.value = false
    deleteTarget.value = null
  } catch (e) {
    error('削除に失敗しました')
  }
}

async function togglePaidStatus(item: any) {
  try {
    await togglePaid(item.id, !item.isPaid)
  } catch (e) {
    error('更新に失敗しました')
    item.isPaid = !item.isPaid
  }
}

async function handleGenerateRecurring() {
  try {
    await generateRecurring()
    success('今月の明細を生成しました')
  } catch (e) {
    error('生成に失敗しました')
  }
}

async function handleBulkSetPaid() {
  if (selectedPayments.value.length === 0) return
  try {
    await bulkSetPaid(selectedPayments.value, true)
    success('選択した項目を支払済みにしました')
    selectedPayments.value = []
  } catch (e) {
    error('更新に失敗しました')
  }
}

async function handleBulkDelete() {
  if (selectedPayments.value.length === 0) return
  if (!confirm('選択した項目を削除してもよろしいですか？')) return

  try {
    await bulkDelete(selectedPayments.value)
    success('削除しました')
    selectedPayments.value = []
  } catch (e) {
    error('削除に失敗しました')
  }
}

async function handleImport() {
  if (!importFile.value) return

  isImporting.value = true
  try {
    await importCsv(importFile.value)
    success('インポートが完了しました')
    importDialog.value = false
    importFile.value = null
  } catch (e) {
    error('インポートに失敗しました')
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="monthly-page">
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap gap-4">
      <div class="d-flex align-center">
        <v-btn icon="mdi-chevron-left" variant="text" @click="prevMonth"></v-btn>
        <h1 class="text-h5 font-weight-bold mx-4">{{ displayMonth }}</h1>
        <v-btn icon="mdi-chevron-right" variant="text" @click="nextMonth"></v-btn>
      </div>
      <div class="d-flex gap-2">
        <v-btn variant="outlined" prepend-icon="mdi-auto-fix" @click="handleGenerateRecurring" class="d-none d-sm-flex">
          テンプレート
        </v-btn>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn variant="outlined" v-bind="props" prepend-icon="mdi-dots-horizontal">
              連携
            </v-btn>
          </template>
          <v-list>
            <v-list-item prepend-icon="mdi-upload" title="インポート" @click="importDialog = true" />
            <v-list-item prepend-icon="mdi-export" title="エクスポート" @click="exportCsv" />
            <v-list-item prepend-icon="mdi-download" title="雛形DL" @click="downloadTemplate" />
          </v-list>
        </v-menu>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="addDialog = true">
          追加
        </v-btn>
      </div>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="6" md="3">
        <v-card class="h-100 rounded-xl" elevation="0" border color="success" variant="tonal">
          <v-card-text>
            <div class="text-caption font-weight-medium mb-1">収入合計</div>
            <div class="text-h6 font-weight-bold">¥{{ totalIncome.toLocaleString() }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="h-100 rounded-xl" elevation="0" border color="error" variant="tonal">
          <v-card-text>
            <div class="text-caption font-weight-medium mb-1">支出合計</div>
            <div class="text-h6 font-weight-bold">¥{{ totalPayment.toLocaleString() }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="h-100 rounded-xl" elevation="0" border :color="balance >= 0 ? 'indigo' : 'error'" variant="tonal">
          <v-card-text>
            <div class="text-caption font-weight-medium mb-1">残高</div>
            <div class="text-h6 font-weight-bold">¥{{ balance.toLocaleString() }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="h-100 rounded-xl" elevation="0" border color="warning" variant="tonal">
          <v-card-text>
            <div class="text-caption font-weight-medium mb-1">残りの支出</div>
            <div class="text-h6 font-weight-bold">¥{{ remainingPayment.toLocaleString() }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Balance Progress -->
    <v-card class="mb-8 pa-4 rounded-xl" elevation="0" border>
      <div class="d-flex justify-space-between text-caption font-weight-medium mb-2">
        <span>支出割合</span>
        <span :class="balanceProgress > 90 ? 'text-error' : 'text-medium-emphasis'">
          {{ balanceProgress.toFixed(1) }}%
        </span>
      </div>
      <v-progress-linear
        :model-value="balanceProgress"
        :color="balanceProgress > 90 ? 'error' : (balanceProgress > 70 ? 'warning' : 'primary')"
        height="8"
        rounded
      ></v-progress-linear>
    </v-card>

    <!-- Bulk Actions -->
    <div v-if="hasSelectedItems" class="d-flex align-center gap-2 mb-4 pa-3 bg-surface-variant rounded-lg">
      <span class="text-body-2 font-weight-medium mr-4">
        {{ selectedPayments.length + selectedIncomes.length }} 件選択中
      </span>
      <v-btn size="small" color="primary" variant="flat" @click="handleBulkSetPaid" v-if="selectedPayments.length > 0">
        支払済みにする
      </v-btn>
      <v-btn size="small" color="error" variant="flat" @click="handleBulkDelete">
        一括削除
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn size="small" variant="text" @click="selectedPayments = []; selectedIncomes = []">
        選択解除
      </v-btn>
    </div>

    <!-- Data Tables -->
    <v-row>
      <!-- Payments -->
      <v-col cols="12" md="6">
        <v-card class="rounded-xl border" elevation="0">
          <v-card-title class="font-weight-bold pa-4 d-flex align-center">
            <v-icon icon="mdi-minus-circle-outline" color="error" class="mr-2" />
            支出 ({{ records.payments.length }})
          </v-card-title>
          <v-divider></v-divider>
          <v-data-table
            v-model="selectedPayments"
            :headers="paymentHeaders"
            :items="records.payments"
            :loading="loading"
            show-select
            item-value="id"
            hover
          >
            <template v-slot:item.name="{ item }">
              <div class="d-flex align-center cursor-pointer" @click="openEditPayment(item)">
                <span :class="{ 'text-medium-emphasis text-decoration-line-through': item.isPaid }">
                  {{ item.name }}
                </span>
              </div>
            </template>
            <template v-slot:item.amount="{ item }">
              <span class="font-mono cursor-pointer" :class="{ 'text-medium-emphasis': item.isPaid }" @click="openEditPayment(item)">
                ¥{{ item.amount.toLocaleString() }}
              </span>
            </template>
            <template v-slot:item.paymentDate="{ item }">
              <span class="text-caption cursor-pointer" :class="{ 'text-medium-emphasis': item.isPaid }" @click="openEditPayment(item)">
                {{ item.paymentDate || '—' }}
              </span>
              <v-btn
                icon
                variant="text"
                size="small"
                class="ml-2"
                :color="item.isPaid ? 'success' : 'default'"
                @click.stop="togglePaidStatus(item)"
              >
                <v-icon>{{ item.isPaid ? 'mdi-check-circle' : 'mdi-check-circle-outline' }}</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Incomes -->
      <v-col cols="12" md="6">
        <v-card class="rounded-xl border" elevation="0">
          <v-card-title class="font-weight-bold pa-4 d-flex align-center">
            <v-icon icon="mdi-plus-circle-outline" color="success" class="mr-2" />
            収入 ({{ records.incomes.length }})
          </v-card-title>
          <v-divider></v-divider>
          <v-data-table
            v-model="selectedIncomes"
            :headers="incomeHeaders"
            :items="records.incomes"
            :loading="loading"
            show-select
            item-value="id"
            hover
          >
            <template v-slot:item.name="{ item }">
              <div class="d-flex align-center cursor-pointer" @click="openEditIncome(item)">
                <span>{{ item.name }}</span>
              </div>
            </template>
            <template v-slot:item.amount="{ item }">
              <span class="font-mono cursor-pointer" @click="openEditIncome(item)">
                ¥{{ item.amount.toLocaleString() }}
              </span>
            </template>
            <template v-slot:item.date="{ item }">
              <span class="text-caption cursor-pointer" @click="openEditIncome(item)">
                {{ item.date || '—' }}
              </span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <AddRecordDialog v-model="addDialog" :month="currentMonth" @success="fetchRecords()" />

    <!-- Edit Payment Dialog -->
    <v-dialog v-model="editPaymentDialog" max-width="500px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 text-h6 font-weight-bold d-flex justify-space-between align-center">
          支出を編集
          <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteTarget = { type: 'payment', ...editPaymentForm }; editPaymentDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-text-field v-model="editPaymentForm.name" label="項目名" variant="outlined" density="comfortable" class="mb-2"></v-text-field>
          <v-text-field v-model="editPaymentForm.amount" label="金額" variant="outlined" density="comfortable" type="number" class="mb-2"></v-text-field>
          <v-text-field v-model="editPaymentForm.paymentDate" label="支払日" placeholder="例: 10/27" variant="outlined" density="comfortable" class="mb-2"></v-text-field>
          <v-checkbox v-model="editPaymentForm.isPaid" label="支払済み" density="compact" hide-details class="mb-2"></v-checkbox>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editPaymentDialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="() => editPaymentForm.templateId ? (saveTarget = { type: 'payment' }) : handleEditPaymentSubmit('this_month')">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Income Dialog -->
    <v-dialog v-model="editIncomeDialog" max-width="500px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 text-h6 font-weight-bold d-flex justify-space-between align-center">
          収入を編集
          <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteTarget = { type: 'income', ...editIncomeForm }; editIncomeDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-text-field v-model="editIncomeForm.name" label="項目名" variant="outlined" density="comfortable" class="mb-2"></v-text-field>
          <v-text-field v-model="editIncomeForm.amount" label="金額" variant="outlined" density="comfortable" type="number" class="mb-2"></v-text-field>
          <v-text-field v-model="editIncomeForm.date" label="日付" placeholder="例: 10/15" variant="outlined" density="comfortable" class="mb-2"></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editIncomeDialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="() => editIncomeForm.templateId ? (saveTarget = { type: 'income' }) : handleEditIncomeSubmit('this_month')">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Scope Dialogs (Save) -->
    <v-dialog :model-value="!!saveTarget" @update:model-value="saveTarget = null" max-width="400px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 text-h6 font-weight-bold">繰り返し項目の編集</v-card-title>
        <v-card-text class="pa-4 pt-0">
          この項目は毎月繰り返す設定になっています。この変更をどのように適用しますか？
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="saveTarget = null">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="() => saveTarget.type === 'payment' ? handleEditPaymentSubmit('this_month') : handleEditIncomeSubmit('this_month')">この月のみ</v-btn>
          <v-btn color="primary" variant="tonal" @click="() => saveTarget.type === 'payment' ? handleEditPaymentSubmit('all_future') : handleEditIncomeSubmit('all_future')">以降もすべて</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Scope Dialogs (Delete) -->
    <v-dialog :model-value="!!deleteTarget" @update:model-value="deleteTarget = null" max-width="400px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 text-h6 font-weight-bold">削除の確認</v-card-title>
        <v-card-text class="pa-4 pt-0">
          {{ deleteTarget?.name }} を削除してもよろしいですか？
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteTarget = null">キャンセル</v-btn>
          <template v-if="deleteTarget?.templateId">
            <v-btn color="error" variant="flat" @click="() => executeDelete('this_month')">この月のみ</v-btn>
            <v-btn color="error" variant="tonal" @click="() => executeDelete('all_future')">以降もすべて</v-btn>
          </template>
          <template v-else>
            <v-btn color="error" variant="flat" @click="() => executeDelete('this_month')">削除</v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Import Dialog -->
    <v-dialog v-model="importDialog" max-width="400px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 text-h6 font-weight-bold">CSVインポート</v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-file-input v-model="importFile" label="CSVファイル" accept=".csv" variant="outlined" density="comfortable"></v-file-input>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="importDialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" :loading="isImporting" :disabled="!importFile" @click="handleImport">インポート</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
