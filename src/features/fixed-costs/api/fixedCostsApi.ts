import { apiClient } from '@/shared/lib/apiClient'

export const fixedCostsApi = {
  getItems(userId: string) {
    return apiClient.get<any[]>('/fixed-costs', { params: { userId } }).then((r) => r.data)
  },

  createItem(payload: any) {
    return apiClient.post('/fixed-costs', payload).then((r) => r.data)
  },

  updateItem(id: string, payload: any) {
    return apiClient.patch(`/fixed-costs/${id}`, payload).then((r) => r.data)
  },

  deleteItem(id: string) {
    return apiClient.delete(`/fixed-costs/${id}`).then((r) => r.data)
  },

  importCsv(formData: FormData) {
    return apiClient.post('/fixed-costs/import', formData).then((r) => r.data)
  },
}
