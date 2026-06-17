import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { fixedCostsRoutes } from './routes/fixed-costs'
import { monthlyRecordsRoutes } from './routes/monthly-records'
import { recurringItemsRoutes } from './routes/recurring-items'
import { usersRoutes } from './routes/users'
import { authHandler } from './auth-handler'

export const app = new OpenAPIHono().basePath('/api')

app.onError((err, c) => {
  console.error(err)
  return c.json({
    error: "Internal Server Error",
    message: err.message,
    stack: err.stack,
  }, 500)
})

app.route('/auth', authHandler)

const routes = app
  .route('/', usersRoutes)
  .route('/', fixedCostsRoutes)
  .route('/', monthlyRecordsRoutes)
  .route('/', recurringItemsRoutes)

app.doc('/doc', {
  openapi: '3.0.0',
  info: { version: '1.0.0', title: 'Bunkatsu API' },
})
app.get('/ui', swaggerUI({ url: '/api/doc' }))

export type AppType = typeof routes

import { handle } from 'hono/vercel'
export const webHandler = handle(app)

