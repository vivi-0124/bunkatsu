import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth'

export const useMonthlyRecordsStore = defineStore('monthlyRecords', () => {
  const authStore = useAuthStore()

  const records = ref<{ payments: any[], incomes: any[] }>({ payments: [], incomes: [] })
  const loading = ref(true)
  const currentMonth = ref('')

  function initMonth() {
    if (!currentMonth.value) {
      const now = new Date()
      currentMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
  }

  async function fetchRecords() {
    if (!authStore.session?.user?.id) return
    loading.value = true
    try {
      const res = await fetch(`/api/monthly-records?month=${currentMonth.value}&userId=${authStore.session.user.id}`)
      if (res.ok) {
        records.value = await res.json()
      }
    } catch (e) {
      console.error(e)
      throw new Error('データの取得に失敗しました')
    } finally {
      loading.value = false
    }
  }

  async function prevMonth() {
    const [year, month] = currentMonth.value.split('-').map(Number)
    if (month === 1) {
      currentMonth.value = `${year - 1}-12`
    } else {
      currentMonth.value = `${year}-${String(month - 1).padStart(2, '0')}`
    }
    await fetchRecords()
  }

  async function nextMonth() {
    const [year, month] = currentMonth.value.split('-').map(Number)
    if (month === 12) {
      currentMonth.value = `${year + 1}-01`
    } else {
      currentMonth.value = `${year}-${String(month + 1).padStart(2, '0')}`
    }
    await fetchRecords()
  }

  async function addPayment(payload: any, isRecurring: boolean) {
    if (!authStore.session?.user?.id) throw new Error('Unauthorized')
    payload.userId = authStore.session.user.id
    
    let res
    if (isRecurring) {
      res = await fetch('/api/recurring-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          type: 'payment',
          startMonth: currentMonth.value,
        })
      })
    } else {
      res = await fetch('/api/monthly-records/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          month: currentMonth.value,
          isPaid: false
        })
      })
    }

    if (res.ok) {
      await fetchRecords()
    } else {
      throw new Error('Failed to add payment')
    }
  }

  async function addIncome(payload: any, isRecurring: boolean) {
    if (!authStore.session?.user?.id) throw new Error('Unauthorized')
    payload.userId = authStore.session.user.id

    let res
    if (isRecurring) {
      res = await fetch('/api/recurring-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          type: 'income',
          startMonth: currentMonth.value,
        })
      })
    } else {
      res = await fetch('/api/monthly-records/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          month: currentMonth.value,
        })
      })
    }

    if (res.ok) {
      await fetchRecords()
    } else {
      throw new Error('Failed to add income')
    }
  }

  async function updatePayment(id: string, payload: any) {
    const res = await fetch(`/api/monthly-records/payment/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to update payment')
    await fetchRecords()
  }

  async function updateIncome(id: string, payload: any) {
    const res = await fetch(`/api/monthly-records/income/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to update income')
    await fetchRecords()
  }

  async function deleteRecord(id: string, type: 'payment' | 'income', scope: 'this_month' | 'all_future') {
    const res = await fetch(`/api/monthly-records/${type}/${id}?scope=${scope}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete')
    await fetchRecords()
  }

  async function togglePaid(id: string, isPaid: boolean) {
    const res = await fetch(`/api/monthly-records/payment/${id}/toggle-paid`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaid })
    })
    if (!res.ok) throw new Error('Failed to toggle paid status')
    await fetchRecords()
  }

  async function generateRecurring() {
    if (!authStore.session?.user?.id) throw new Error('Unauthorized')
    const res = await fetch('/api/monthly-records/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authStore.session.user.id, month: currentMonth.value })
    })
    if (!res.ok) throw new Error('Failed to generate')
    await fetchRecords()
  }

  async function bulkSetPaid(ids: string[], isPaid: boolean) {
    if (!authStore.session?.user?.id) throw new Error('Unauthorized')
    const res = await fetch('/api/monthly-records/bulk-set-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authStore.session.user.id, ids, isPaid })
    })
    if (!res.ok) throw new Error('Failed to bulk set paid')
    await fetchRecords()
  }

  async function bulkDelete(ids: string[]) {
    if (!authStore.session?.user?.id) throw new Error('Unauthorized')
    const res = await fetch('/api/monthly-records/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authStore.session.user.id, ids })
    })
    if (!res.ok) throw new Error('Failed to bulk delete')
    await fetchRecords()
  }

  async function importCsv(file: File) {
    if (!authStore.session?.user?.id) throw new Error('Unauthorized')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', authStore.session.user.id)
    const res = await fetch('/api/monthly-records/import', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Failed to import')
    await fetchRecords()
  }

  function downloadTemplate() {
    window.open('/api/monthly-records/template', '_blank')
  }

  function exportCsv() {
    if (!authStore.session?.user?.id) return
    window.open(`/api/monthly-records/export?month=${currentMonth.value}&userId=${authStore.session.user.id}`, '_blank')
  }

  // Computed
  const displayMonth = computed(() => {
    const [year, month] = currentMonth.value.split('-')
    return `${year}年${Number(month)}月`
  })
  
  const totalIncome = computed(() => records.value.incomes.reduce((sum: number, item: any) => sum + Number(item.amount), 0))
  const totalPayment = computed(() => records.value.payments.reduce((sum: number, item: any) => sum + Number(item.amount), 0))
  const remainingPayment = computed(() => records.value.payments.filter((p: any) => !p.isPaid).reduce((sum: number, item: any) => sum + Number(item.amount), 0))
  const balance = computed(() => totalIncome.value - totalPayment.value)
  const balanceProgress = computed(() => {
    if (totalIncome.value === 0) return 100
    return Math.min((totalPayment.value / totalIncome.value) * 100, 100)
  })

  return {
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
    prevMonth,
    nextMonth,
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
    exportCsv
  }
})
