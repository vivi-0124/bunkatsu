import { handle } from 'hono/vercel'

let webHandler: any = null;
let bootError: any = null;

try {
  // Top-level await によるダイナミックインポート。
  // 静的リテラルパスをインポートするため、Vercel (esbuild) はこれを検出し、
  // すべての依存モジュールを1ファイルにインラインバンドルします（Cannot find module が起きません）。
  const { app } = await import('../server/app');
  webHandler = handle(app);
} catch (error: any) {
  console.error("🔥 Vercel Top-level Boot Error:", error);
  bootError = error;
}

export default async function handler(req: any, res: any) {
  console.log(`[API Request] ${req.method} ${req.url}`);
  
  if (bootError) {
    console.error("Boot error active, returning JSON response.");
    if (res && typeof res.status === 'function') {
      return res.status(500).json({
        error: "Vercel Boot Exception (Top-level)",
        message: bootError.message || String(bootError),
        stack: bootError.stack,
      });
    }
  }

  try {
    return webHandler(req, res);
  } catch (error: any) {
    console.error("Vercel Request Execution Error Caught:", error);
    if (res && typeof res.status === 'function') {
      res.status(500).json({
        error: "Vercel Execution Error",
        message: error.message,
        stack: error.stack,
      });
    }
  }
}









