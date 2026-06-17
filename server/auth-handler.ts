import { Hono } from 'hono'
import { auth } from '../lib/auth'

export const authHandler = new Hono()
  .on(['GET', 'POST'], '/*', async (c) => {
    try {
      return await auth.handler(c.req.raw)
    } catch (e) {
      console.error('[auth] handler error:', e)
      return c.json({ error: String(e) }, 500)
    }
  })
