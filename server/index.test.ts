import { describe, it, expect } from 'vitest'
import { app } from './app' // export app from index

// Hono のテスト
describe('Hono Server API', () => {
  it('GET /api/doc が OpenAPI 仕様を返すこと', async () => {
    const res = await app.request('/api/doc')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.openapi).toBe('3.0.0')
    expect(json.info.title).toBe('Bunkatsu API')
  })
  
  it('GET /api/users が200を返し、配列を取得できること', async () => {
    const res = await app.request('/api/users')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })
})
