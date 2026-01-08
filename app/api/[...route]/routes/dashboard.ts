import { Hono } from "hono";
import { db } from "@/db";
import { dashboardTasks } from "@/db/schemas/dashboard-schema";

export const dashboardRoutes = new Hono().get("/dashboard-tasks", async (c) => {
  const data = await db.select().from(dashboardTasks);
  return c.json(data);
});
