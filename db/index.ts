import "dotenv/config";
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

export const db = drizzle({
  connection: {
    url,
    authToken,
  },
  schema: { ...authSchema, ...dashboardSchema, ...book, ...installmentSchema },
});
