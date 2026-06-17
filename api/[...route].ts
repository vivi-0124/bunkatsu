import { handle } from 'hono/vercel'

export default async function handler(req: Request, event: any) {
  try {
    const { app } = await import('../server/app')
    const webHandler = handle(app)
    return await webHandler(req, event)
  } catch (error: any) {
    console.error("Vercel Boot Error:", error)
    return new Response(
      JSON.stringify({
        error: "Vercel Boot Error",
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
