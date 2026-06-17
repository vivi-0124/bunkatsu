import { sentinelClient } from "@better-auth/infra/client";
import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  baseURL: import.meta.env?.VITE_BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [sentinelClient()],
});
