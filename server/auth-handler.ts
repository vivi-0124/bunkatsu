import { Hono } from 'hono'
import { auth } from '../lib/auth.js'

export const authHandler = new Hono()
  .on(['GET', 'POST'], '/*', async (c) => {
    return auth.handler(c.req.raw)
  })
