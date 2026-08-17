<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSnackbar } from '@/shared/composables/useSnackbar'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'
import { useFixedCostsStore } from '../stores/fixedCosts'

const { success, error } = useSnackbar()
const { mdAndDown } = useDisplay()

const store = useFixedCostsStore()
const { items, loading } = storeToRefs(store)

// State
const search = ref('')
const statusFilter = ref('all') // all, not_started, in_progress, completed

// Dialogs
const editDialog = ref(false)
const deleteDialog = ref(false)
const importDialog = ref(false)

// Form
const defaultForm = {
  id: '',
  name: '',
  totalPayments: '',
  startDate: '',
  amountPerPayment: '',
  totalAmount: ''
}
const formData = ref({ ...defaultForm })
const isEditing = computed(() => !!formData.value.id)
const deleteId = ref('')

// Import
const importFile = ref<File | null>(null)
const isImporting = ref(false)

async function saveItem() {
  if (!formData.value.name || !formData.value.startDate || !formData.value.amountPerPayment) {
    error('必須項目を入力してください')
    return
  }

  const payload = {
    name: formData.value.name,
    totalPayments: formData.value.totalPayments ? Number(formData.value.totalPayments) : null,
    startDate: formData.value.startDate,
    amountPerPayment: Number(formData.value.amountPerPayment),
    totalAmount: formData.value.totalAmount ? Number(formData.value.totalAmount) : null,
  }

  try {
    await store.saveItem(payload, isEditing.value, formData.value.id)
    success(isEditing.value ? '更新しました' : '追加しました')
    editDialog.value = false
  } catch (e) {
    error('保存に失敗しました')
  }
}

async function deleteItem() {
  try {
    await store.deleteItem(deleteId.value)
    success('削除しました')
    deleteDialog.value = false
  } catch (e) {
    error('削除に失敗しました')
  }
}

async function handleImport() {
  if (!importFile.value) return
  
  isImporting.value = true
  try {
    await store.importCsv(importFile.value)
    success('インポートが完了しました')
    importDialog.value = false
    importFile.value = null
  } catch (e) {
    error('インポートに失敗しました')
  } finally {
    isImporting.value = false
  }
}

function downloadTemplate() {
  store.downloadTemplate()
}

function exportCsv() {
  store.exportCsv()
}

// Handlers
function openAdd() {
  formData.value = { ...defaultForm }
  const now = new Date()
  formData.value.startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  editDialog.value = true
}

function openEdit(item: any) {
  formData.value = {
    id: item.id,
    name: item.name,
    totalPayments: item.totalPayments?.toString() || '',
    startDate: item.startDate,
    amountPerPayment: item.amountPerPayment?.toString() || '',
    totalAmount: item.totalAmount?.toString() || ''
  }
  editDialog.value = true
}

function openDelete(id: string) {
  deleteId.value = id
  deleteDialog.value = true
}

// Computed Data
const filteredItems = computed(() => {
  let result = items.value

  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter(i => i.name.toLowerCase().includes(s))
  }

  if (statusFilter.value !== 'all') {
    result = result.filter(i => {
      if (statusFilter.value === 'completed') return i.isCompleted
      if (statusFilter.value === 'not_started') return !i.isStarted
      if (statusFilter.value === 'in_progress') return i.isStarted && !i.isCompleted
      return true
    })
  }

  return result
})

// Calculations for table
function getProgress(item: any) {
  if (!item.totalPayments) return 0
  return ((item.currentPayment || 0) / item.totalPayments) * 100
}

function getRemainingAmount(item: any) {
  if (!item.totalPayments) return null
  return item.amountPerPayment * (item.totalPayments - (item.currentPayment || 0))
}

const headers = [
  { title: '項目名', key: 'name' },
  { title: 'ステータス', key: 'status' },
  { title: '進捗', key: 'progress' },
  { title: '月額', key: 'amountPerPayment' },
  { title: '総額', key: 'totalAmount' },
  { title: '残り', key: 'remaining' },
  { title: '開始', key: 'startDate' },
  { title: '完済予定', key: 'endDate' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' as const },
]

onMounted(() => {
  store.fetchItems()
})
</script>

<template>
  <div class="fixed-costs-page">
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap gap-4">
      <h1 class="text-h4 font-weight-bold">分割払い・固定費</h1>
      <div class="d-flex gap-2">
        <v-btn variant="outlined" prepend-icon="mdi-download" @click="downloadTemplate" class="d-none d-sm-flex">
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
          </v-list>
        </v-menu>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openAdd">
          新規追加
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="項目名で検索..."
          variant="outlined"
          density="compact"
          hide-details
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="statusFilter"
          :items="[
            { title: 'すべて', value: 'all' },
            { title: '開始前', value: 'not_started' },
            { title: '支払い中', value: 'in_progress' },
            { title: '完済', value: 'completed' }
          ]"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-filter"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Data Display -->
    <v-card class="border rounded-xl" elevation="0">
      <v-data-table
        v-if="!mdAndDown"
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        hover
      >
        <!-- Custom Slots -->
        <template v-slot:item.name="{ item }">
          <div class="font-weight-bold">{{ item.name }}</div>
          <div class="text-caption text-medium-emphasis">#{{ item.id.substring(0, 8) }}</div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip v-if="item.isCompleted" color="success" size="small" variant="flat">完了</v-chip>
          <v-chip v-else-if="!item.isStarted" color="warning" size="small" variant="flat">開始前</v-chip>
          <v-chip v-else color="primary" size="small" variant="flat">支払い中</v-chip>
        </template>

        <template v-slot:item.progress="{ item }">
          <div v-if="item.totalPayments" class="d-flex flex-column" style="width: 100px">
            <span class="text-caption mb-1">{{ item.currentPayment }} / {{ item.totalPayments }} 回</span>
            <v-progress-linear :model-value="getProgress(item)" color="primary" height="6" rounded></v-progress-linear>
          </div>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template v-slot:item.amountPerPayment="{ item }">
          <span class="font-weight-medium">¥{{ Number(item.amountPerPayment || 0).toLocaleString() }}</span>
        </template>

        <template v-slot:item.totalAmount="{ item }">
          <span class="text-medium-emphasis">
            {{ item.totalAmount ? `¥${Number(item.totalAmount).toLocaleString()}` : (item.totalPayments ? `¥${Number(Number(item.amountPerPayment) * Number(item.totalPayments)).toLocaleString()}` : '—') }}
          </span>
        </template>

        <template v-slot:item.remaining="{ item }">
          <span :class="item.isCompleted ? 'text-medium-emphasis' : 'text-success font-weight-bold'">
            {{ getRemainingAmount(item) !== null ? `¥${Number(getRemainingAmount(item)).toLocaleString()}` : '—' }}
          </span>
        </template>

        <template v-slot:item.endDate="{ item }">
          {{ item.endDate || '—' }}
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEdit(item)"></v-btn>
            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="openDelete(item.id)"></v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- Mobile View -->
      <div v-else class="pa-4 bg-background">
        <v-card v-for="item in filteredItems" :key="item.id" class="mb-4 rounded-xl border" elevation="0" :class="{ 'opacity-60': item.isCompleted }">
          <v-card-text>
            <div class="d-flex justify-space-between align-start mb-2">
              <div>
                <div class="text-h6 font-weight-bold">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis">#{{ item.id.substring(0,8) }}</div>
              </div>
              <div class="d-flex align-center">
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)"></v-btn>
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="openDelete(item.id)"></v-btn>
              </div>
            </div>
            
            <div class="d-flex justify-space-between text-caption mb-1">
              <span>{{ item.totalPayments ? `${item.currentPayment} / ${item.totalPayments} 回` : '無期限' }}</span>
              <span>{{ item.startDate }} → {{ item.endDate || '∞' }}</span>
            </div>
            <v-progress-linear :model-value="getProgress(item)" color="primary" height="6" rounded class="mb-4"></v-progress-linear>

            <v-row no-gutters>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">月額</div>
                <div class="font-weight-bold">¥{{ Number(item.amountPerPayment || 0).toLocaleString() }}</div>
              </v-col>
              <v-col cols="6" class="text-right">
                <div class="text-caption text-medium-emphasis">残り</div>
                <div class="font-weight-bold text-primary">{{ getRemainingAmount(item) !== null ? `¥${Number(getRemainingAmount(item)).toLocaleString()}` : '-' }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <div v-if="filteredItems.length === 0" class="text-center py-8 text-medium-emphasis">
          データがありません
        </div>
      </div>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 pb-2 text-h6 font-weight-bold">
          {{ isEditing ? '固定費を編集' : '新しい固定費を追加' }}
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-text-field v-model="formData.name" label="項目名" variant="outlined" density="comfortable" class="mb-2" required></v-text-field>
          <v-text-field v-model="formData.totalPayments" label="支払い回数 (空欄で無期限)" variant="outlined" density="comfortable" type="number" class="mb-2"></v-text-field>
          <v-text-field v-model="formData.startDate" label="開始月 (YYYY-MM)" variant="outlined" density="comfortable" class="mb-2" required></v-text-field>
          <v-text-field v-model="formData.amountPerPayment" label="月額" variant="outlined" density="comfortable" type="number" class="mb-2" required></v-text-field>
          <v-text-field v-model="formData.totalAmount" label="総額 (空欄可)" variant="outlined" density="comfortable" type="number"></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="saveItem">{{ isEditing ? '更新' : '追加' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 text-h6 font-weight-bold">削除の確認</v-card-title>
        <v-card-text class="pa-4 pt-0">
          本当にこの固定費を削除してもよろしいですか？<br />この操作は取り消せません。
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" variant="flat" @click="deleteItem">削除する</v-btn>
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
