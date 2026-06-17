import { handle } from 'hono/vercel'

export default async function handler(req: Request, event: any) {
  console.log(`[API Request] ${req.method} ${req.url}`);
  
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Vercel Request Timeout after 8 seconds")), 8000)
  );

  const processPromise = (async () => {
    try {
      console.log("--> Dynamic import of server/app starting...");
      const { app } = await import('../server/app');
      console.log("--> Dynamic import completed successfully.");
      
      const webHandler = handle(app);
      console.log("--> Hono handle starting execution...");
      const res = await webHandler(req, event);
      console.log("--> Hono handle execution completed.");
      return res;
    } catch (e) {
      console.error("--> Inner process execution failed:", e);
      throw e;
    }
  })();

  try {
    const response = await Promise.race([processPromise, timeoutPromise]) as Response;
    console.log(`[API Response] Status ${response.status}`);
    return response;
  } catch (error: any) {
    console.error("Vercel Boot/Request Error Caught:", error);
    return new Response(
      JSON.stringify({
        error: "Vercel Execution Error",
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

