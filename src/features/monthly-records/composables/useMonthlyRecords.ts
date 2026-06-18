import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/features/auth/stores/auth'
import { monthlyRecordsApi } from '../api/monthlyRecordsApi'

const currentMonth = ref('')

export function useMonthlyRecords() {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()
  const userId = computed(() => authStore.session?.user?.id as string | undefined)

  function initMonth() {
    if (!currentMonth.value) {
      const now = new Date()
      currentMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
  }

  const queryKey = computed(() => ['monthly-records', currentMonth.value])

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => monthlyRecordsApi.getRecords(currentMonth.value, userId.value!),
    enabled: computed(() => !!userId.value && !!currentMonth.value),
  })

  const records = computed(() => data.value ?? { payments: [], incomes: [] })
  const loading = isLoading

  function invalidateRecords() {
    return queryClient.invalidateQueries({ queryKey: ['monthly-records'] })
  }

  async function fetchRecords() {
    const result = await refetch()
    if (result.isError) throw new Error('データの取得に失敗しました')
  }

  function prevMonth() {
    const [year, month] = currentMonth.value.split('-').map(Number)
    currentMonth.value =
      month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
  }

  function nextMonth() {
    const [year, month] = currentMonth.value.split('-').map(Number)
    currentMonth.value =
      month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
  }

  const addPaymentMutation = useMutation({
    mutationFn: ({ payload, isRecurring }: { payload: any; isRecurring: boolean }) =>
      isRecurring
        ? monthlyRecordsApi.addRecurringItem({ ...payload, type: 'payment', startMonth: currentMonth.value })
        : monthlyRecordsApi.addPayment({ ...payload, month: currentMonth.value, isPaid: false }),
    onSuccess: invalidateRecords,
  })

  const addIncomeMutation = useMutation({
    mutationFn: ({ payload, isRecurring }: { payload: any; isRecurring: boolean }) =>
      isRecurring
        ? monthlyRecordsApi.addRecurringItem({ ...payload, type: 'income', startMonth: currentMonth.value })
        : monthlyRecordsApi.addIncome({ ...payload, month: currentMonth.value }),
    onSuccess: invalidateRecords,
  })

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      monthlyRecordsApi.updatePayment(id, payload),
    onSuccess: invalidateRecords,
  })

  const updateIncomeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      monthlyRecordsApi.updateIncome(id, payload),
    onSuccess: invalidateRecords,
  })

  const deleteRecordMutation = useMutation({
    mutationFn: ({ type, id, scope }: { type: 'payment' | 'income'; id: string; scope: string }) =>
      monthlyRecordsApi.deleteRecord(type, id, scope),
    onSuccess: invalidateRecords,
  })

  const togglePaidMutation = useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      monthlyRecordsApi.togglePaid(id, isPaid),
    onSuccess: invalidateRecords,
  })

  const generateRecurringMutation = useMutation({
    mutationFn: () => monthlyRecordsApi.generateRecurring(userId.value!, currentMonth.value),
    onSuccess: invalidateRecords,
  })

  const bulkSetPaidMutation = useMutation({
    mutationFn: ({ ids, isPaid }: { ids: string[]; isPaid: boolean }) =>
      monthlyRecordsApi.bulkSetPaid(userId.value!, ids, isPaid),
    onSuccess: invalidateRecords,
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => monthlyRecordsApi.bulkDelete(userId.value!, ids),
    onSuccess: invalidateRecords,
  })

  const importCsvMutation = useMutation({
    mutationFn: (formData: FormData) => monthlyRecordsApi.importCsv(formData),
    onSuccess: invalidateRecords,
  })

  async function addPayment(payload: any, isRecurring: boolean) {
    if (!userId.value) throw new Error('Unauthorized')
    await addPaymentMutation.mutateAsync({ payload: { ...payload, userId: userId.value }, isRecurring })
  }

  async function addIncome(payload: any, isRecurring: boolean) {
    if (!userId.value) throw new Error('Unauthorized')
    await addIncomeMutation.mutateAsync({ payload: { ...payload, userId: userId.value }, isRecurring })
  }

  async function updatePayment(id: string, payload: any) {
    await updatePaymentMutation.mutateAsync({ id, payload })
  }

  async function updateIncome(id: string, payload: any) {
    await updateIncomeMutation.mutateAsync({ id, payload })
  }

  async function deleteRecord(id: string, type: 'payment' | 'income', scope: 'this_month' | 'all_future') {
    await deleteRecordMutation.mutateAsync({ type, id, scope })
  }

  async function togglePaid(id: string, isPaid: boolean) {
    await togglePaidMutation.mutateAsync({ id, isPaid })
  }

  async function generateRecurring() {
    if (!userId.value) throw new Error('Unauthorized')
    await generateRecurringMutation.mutateAsync()
  }

  async function bulkSetPaid(ids: string[], isPaid: boolean) {
    if (!userId.value) throw new Error('Unauthorized')
    await bulkSetPaidMutation.mutateAsync({ ids, isPaid })
  }

  async function bulkDelete(ids: string[]) {
    if (!userId.value) throw new Error('Unauthorized')
    await bulkDeleteMutation.mutateAsync(ids)
  }

  async function importCsv(file: File) {
    if (!userId.value) throw new Error('Unauthorized')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId.value)
    await importCsvMutation.mutateAsync(formData)
  }

  function downloadTemplate() {
    window.open('/api/monthly-records/template', '_blank')
  }

  function exportCsv() {
    if (!userId.value) return
    window.open(`/api/monthly-records/export?month=${currentMonth.value}&userId=${userId.value}`, '_blank')
  }

  const displayMonth = computed(() => {
    if (!currentMonth.value) return ''
    const [year, month] = currentMonth.value.split('-')
    return `${year}年${Number(month)}月`
  })

  const totalIncome = computed(() =>
    records.value.incomes.reduce((sum: number, item: any) => sum + Number(item.amount), 0),
  )
  const totalPayment = computed(() =>
    records.value.payments.reduce((sum: number, item: any) => sum + Number(item.amount), 0),
  )
  const remainingPayment = computed(() =>
    records.value.payments
      .filter((p: any) => !p.isPaid)
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0),
  )
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
    exportCsv,
  }
}
