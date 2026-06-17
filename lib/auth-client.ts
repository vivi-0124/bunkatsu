import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  baseURL: import.meta.env?.VITE_BETTER_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
});
