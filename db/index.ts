import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as authSchema from "./schemas/auth-schema";
import * as fixedCostSchema from "./schemas/fixed-cost";
import * as monthlyRecordSchema from "./schemas/monthly-record";
import * as recurringItemSchema from "./schemas/recurring-item";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set");
}

// intMode: "string" を設定することで、整数値を文字列として安全に扱えるようにする
// これにより Number.MAX_SAFE_INTEGER を超える値もエラーなく処理可能
const client = createClient({
  url,
  authToken,
  intMode: "string",
});

export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...fixedCostSchema,
    ...monthlyRecordSchema,
    ...recurringItemSchema,
  },
  casing: "snake_case",
});
