import { apiClient } from '@/shared/lib/apiClient'

export const monthlyRecordsApi = {
  getRecords(month: string, userId: string) {
    return apiClient
      .get<{ payments: any[]; incomes: any[] }>('/monthly-records', { params: { month, userId } })
      .then((r) => r.data)
  },

  addPayment(payload: any) {
    return apiClient.post('/monthly-records/payment', payload).then((r) => r.data)
  },

  addIncome(payload: any) {
    return apiClient.post('/monthly-records/income', payload).then((r) => r.data)
  },

  addRecurringItem(payload: any) {
    return apiClient.post('/recurring-items', payload).then((r) => r.data)
  },

  updatePayment(id: string, payload: any) {
    return apiClient.patch(`/monthly-records/payment/${id}`, payload).then((r) => r.data)
  },

  updateIncome(id: string, payload: any) {
    return apiClient.patch(`/monthly-records/income/${id}`, payload).then((r) => r.data)
  },

  deleteRecord(type: 'payment' | 'income', id: string, scope: string) {
    return apiClient
      .delete(`/monthly-records/${type}/${id}`, { params: { scope } })
      .then((r) => r.data)
  },

  togglePaid(id: string, isPaid: boolean) {
    return apiClient
      .patch(`/monthly-records/payment/${id}/toggle-paid`, { isPaid })
      .then((r) => r.data)
  },

  generateRecurring(userId: string, month: string) {
    return apiClient
      .post('/monthly-records/generate', { userId, month })
      .then((r) => r.data)
  },

  bulkSetPaid(userId: string, ids: string[], isPaid: boolean) {
    return apiClient
      .post('/monthly-records/bulk-set-paid', { userId, ids, isPaid })
      .then((r) => r.data)
  },

  bulkDelete(userId: string, ids: string[]) {
    return apiClient
      .post('/monthly-records/bulk-delete', { userId, ids })
      .then((r) => r.data)
  },

  importCsv(formData: FormData) {
    return apiClient.post('/monthly-records/import', formData).then((r) => r.data)
  },
}
