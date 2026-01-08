import { Hono } from "hono";

export const helloRoutes = new Hono().get("/hello", (c) => {
  return c.json({
    message: "Hello from Hono!",
  });
});
