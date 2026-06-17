import { handle } from 'hono/vercel'

export default async function handler(req: any, res: any) {
  console.log(`[API Request] ${req.method} ${req.url}`);
  
  try {
    console.log("--> Dynamic import of server/app starting...");
    const { app } = await import('../server/app');
    console.log("--> Dynamic import completed successfully.");
    
    const webHandler = handle(app);
    console.log("--> Hono handle starting execution...");
    return webHandler(req, res);
  } catch (error: any) {
    console.error("Vercel Boot Error Caught:", error);
    if (res && typeof res.status === 'function') {
      res.status(500).json({
        error: "Vercel Execution Error",
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error("Response object is invalid or not available.");
    }
  }
}


