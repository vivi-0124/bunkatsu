import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      { id: '2', name: 'Test User', email: 'test@example.com', role: 'user' },
    ])
  }),

  http.patch('/api/users/:id/role', ({ params }) => {
    const { id } = params
    return HttpResponse.json({ success: true, id })
  }),

  // Add more API mocks as needed
]
