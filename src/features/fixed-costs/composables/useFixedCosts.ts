import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/features/auth/stores/auth'
import { fixedCostsApi } from '../api/fixedCostsApi'

export function useFixedCosts() {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()
  const userId = computed(() => authStore.session?.user?.id as string | undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['fixed-costs'],
    queryFn: () => fixedCostsApi.getItems(userId.value!),
    enabled: computed(() => !!userId.value),
  })

  const items = computed(() => data.value ?? [])
  const loading = isLoading

  function invalidateItems() {
    return queryClient.invalidateQueries({ queryKey: ['fixed-costs'] })
  }

  const saveItemMutation = useMutation({
    mutationFn: ({ payload, isEditing, id }: { payload: any; isEditing: boolean; id?: string }) =>
      isEditing && id
        ? fixedCostsApi.updateItem(id, payload)
        : fixedCostsApi.createItem(payload),
    onSuccess: invalidateItems,
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => fixedCostsApi.deleteItem(id),
    onSuccess: invalidateItems,
  })

  const importCsvMutation = useMutation({
    mutationFn: (formData: FormData) => fixedCostsApi.importCsv(formData),
    onSuccess: invalidateItems,
  })

  async function fetchItems() {
    await invalidateItems()
  }

  async function saveItem(payload: any, isEditing: boolean, id?: string) {
    if (!userId.value) throw new Error('Unauthorized')
    await saveItemMutation.mutateAsync({ payload: { ...payload, userId: userId.value }, isEditing, id })
  }

  async function deleteItem(id: string) {
    await deleteItemMutation.mutateAsync(id)
  }

  async function importCsv(file: File) {
    if (!userId.value) throw new Error('Unauthorized')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId.value)
    await importCsvMutation.mutateAsync(formData)
  }

  function downloadTemplate() {
    window.open('/api/fixed-costs/template', '_blank')
  }

  function exportCsv() {
    if (!userId.value) return
    window.open(`/api/fixed-costs/export?userId=${userId.value}`, '_blank')
  }

  return {
    items,
    loading,
    fetchItems,
    saveItem,
    deleteItem,
    importCsv,
    downloadTemplate,
    exportCsv,
  }
}
