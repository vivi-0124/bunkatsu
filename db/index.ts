import "dotenv/config";
import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";


import * as authSchema from "./schemas/auth-schema";
import * as fixedCostSchema from "./schemas/fixed-cost";
import * as monthlyRecordSchema from "./schemas/monthly-record";
import * as recurringItemSchema from "./schemas/recurring-item";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.warn("⚠️ WARNING: TURSO_DATABASE_URL is not set. Database actions will crash during request processing.");
}

// url がない場合はダミーのURLを使用することで起動時の例外を防ぐ
const client = createClient({
  url: url || "libsql://placeholder-to-prevent-boot-crash-temporary.io",
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
