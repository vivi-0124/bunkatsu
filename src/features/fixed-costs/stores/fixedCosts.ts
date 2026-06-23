import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth'

export const useFixedCostsStore = defineStore('fixedCosts', () => {
  const items = ref<any[]>([])
  const loading = ref(true)

  const authStore = useAuthStore()

  async function fetchItems() {
    if (!authStore.session?.user?.id) return
    loading.value = true
    try {
      const res = await fetch(`/api/fixed-costs?userId=${authStore.session.user.id}`)
      if (res.ok) {
        items.value = await res.json()
      }
    } catch (e) {
      console.error(e)
      throw new Error('データの取得に失敗しました')
    } finally {
      loading.value = false
    }
  }

  async function saveItem(payload: any, isEditing: boolean, id?: string) {
    if (!authStore.session?.user?.id) throw new Error('Unauthorized')
    
    // Ensure userId is present in payload
    payload.userId = authStore.session.user.id

    let res
    if (isEditing && id) {
      res = await fetch(`/api/fixed-costs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      res = await fetch('/api/fixed-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }

    if (res.ok) {
      await fetchItems()
    } else {
      throw new Error('Save failed')
    }
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/fixed-costs/${id}`, { method: 'DELETE' })
    if (res.ok) {
      await fetchItems()
    } else {
      throw new Error('Delete failed')
    }
  }

  async function importCsv(file: File) {
    if (!authStore.session?.user?.id) throw new Error('Unauthorized')

    const csvData = await file.text()
    const res = await fetch('/api/fixed-costs/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData, userId: authStore.session.user.id })
    })

    if (res.ok) {
      await fetchItems()
    } else {
      throw new Error('Import failed')
    }
  }

  function downloadTemplate() {
    window.open('/api/fixed-costs/template', '_blank')
  }

  function exportCsv() {
    if (!authStore.session?.user?.id) return
    window.open(`/api/fixed-costs/export?userId=${authStore.session.user.id}`, '_blank')
  }

  return {
    items,
    loading,
    fetchItems,
    saveItem,
    deleteItem,
    importCsv,
    downloadTemplate,
    exportCsv
  }
})
