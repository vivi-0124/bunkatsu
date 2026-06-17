import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const recurringItems = sqliteTable("recurring_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  amount: integer("amount").notNull().default(0),
  type: text("type", { enum: ["payment", "income"] }).notNull(),
  startMonth: text("start_month"), // YYYY-MM
  paymentDate: text("payment_date"), // MM/DD or arbitrary text
  accountSource: text("account_source"), // 引き落とし口座
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type RecurringItem = typeof recurringItems.$inferSelect;
export type NewRecurringItem = typeof recurringItems.$inferInsert;
