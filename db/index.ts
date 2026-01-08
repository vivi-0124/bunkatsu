import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as authSchema from "./schemas/auth-schema";
import * as book from "./schemas/book";
import * as dashboardSchema from "./schemas/dashboard-schema";
import * as installmentSchema from "./schemas/installment";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set");
}

// intMode: "number" を設定することで、大きな整数値を安全に扱えるようにする
// ただし、Number.MAX_SAFE_INTEGERを超える値がある場合はエラーになる
// もしBigIntを使用したい場合は "bigint" に変更し、フロントエンドでBigIntを処理する必要がある
const client = createClient({
  url,
  authToken,
  intMode: "number",
});

export const db = drizzle(client, {
  schema: { ...authSchema, ...dashboardSchema, ...book, ...installmentSchema },
  casing: "snake_case",
});
