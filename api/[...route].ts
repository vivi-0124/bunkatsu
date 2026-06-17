// インポートを行う前に、未キャッチ例外のハンドラを登録して起動時エラーを補足する
let bootError: any = null;

if (typeof process !== 'undefined') {
  process.on('uncaughtException', (err) => {
    console.error("🔥 Uncaught Exception caught during boot/runtime:", err);
    bootError = err;
  });
  process.on('unhandledRejection', (reason) => {
    console.error("🔥 Unhandled Rejection caught during boot/runtime:", reason);
    bootError = reason;
  });
}

export default async function handler(req: any, res: any) {
  console.log(`[API Request] ${req.method} ${req.url}`);
  
  // 起動時（インポート時）にエラーが発生していた場合は、ここでJSONを返す
  if (bootError) {
    console.error("Returning boot error response:", bootError);
    if (res && typeof res.status === 'function') {
      return res.status(500).json({
        error: "Vercel Boot Exception (Uncaught)",
        message: bootError.message || String(bootError),
        stack: bootError.stack,
      });
    }
  }

  try {
    console.log("--> Dynamically importing server/app...");
    const { webHandler } = await import('../server/app');
    console.log("--> _handler imported, executing...");
    return webHandler(req, res);
  } catch (error: any) {
    console.error("Vercel Request/Import Error Caught:", error);
    if (res && typeof res.status === 'function') {
      res.status(500).json({
        error: "Vercel Execution/Import Error",
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error("Response object is invalid or not available.");
    }
  }
}






