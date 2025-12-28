import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const dashboardTasks = sqliteTable("dashboard_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  header: text("header").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  target: integer("target").notNull(),
  limit: integer("limit").notNull(),
  reviewer: text("reviewer").notNull(),
});
