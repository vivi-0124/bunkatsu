import { handle } from 'hono/vercel'
import { app } from '../server/app'

export default async function handler(req: any, res: any) {
  console.log(`[API Request] ${req.method} ${req.url}`);
  
  try {
    const webHandler = handle(app);
    console.log("--> Hono handle starting execution...");
    return webHandler(req, res);
  } catch (error: any) {
    console.error("Vercel Boot/Request Error Caught:", error);
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



