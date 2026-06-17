import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";

import * as authSchema from "../db/schemas/auth-schema.js";

const baseURL = process.env.BETTER_AUTH_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

let _auth: any = null;

function getAuthInstance() {
  if (!_auth) {
    try {
      const secret = process.env.BETTER_AUTH_SECRET || "temporary-placeholder-secret-to-prevent-boot-crash-123456";
      const googleClientId = process.env.GOOGLE_CLIENT_ID || "placeholder-client-id";
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "placeholder-client-secret";

      _auth = betterAuth({
        database: drizzleAdapter(db, {
          provider: "sqlite",
          usePlural: true,
          schema: {
            ...authSchema,
          },
        }),
        baseURL,
        secret,
        trustedOrigins: [baseURL],
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        },
        user: {
          additionalFields: {
            role: {
              type: "string",
              defaultValue: "user",
            },
          },
        },
      });
    } catch (e: any) {
      console.error("❌ Failed to initialize Better Auth in getAuthInstance:", e);
      throw e;
    }
  }
  return _auth;
}

// Proxyを使って、任意のプロパティにアクセスされたときに初めて実体を初期化する
export const auth = new Proxy({} as any, {
  get(target, prop, receiver) {
    try {
      const instance = getAuthInstance();
      const value = Reflect.get(instance, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    } catch (e: any) {
      console.error(`❌ Proxy access failed for property ${String(prop)}:`, e);
      throw e;
    }
  }
});

