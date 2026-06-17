import { Hono } from 'hono'
import { auth } from '../lib/auth'

export const authHandler = new Hono()
  .on(['GET', 'POST'], '/*', async (c) => {
    return auth.handler(c.req.raw)
  })
