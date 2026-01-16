import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 支出項目テンプレート
export const paymentItemTemplates = sqliteTable("payment_item_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  defaultAmount: integer("default_amount"), // デフォルト金額（任意）
  defaultPaymentDate: text("default_payment_date"), // デフォルト支払日（任意、例: 27）
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 収入項目テンプレート
export const incomeItemTemplates = sqliteTable("income_item_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  defaultAmount: integer("default_amount"), // デフォルト金額（任意）
  defaultDate: text("default_date"), // デフォルト日付（任意、例: 15）
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type PaymentItemTemplate = typeof paymentItemTemplates.$inferSelect;
export type NewPaymentItemTemplate = typeof paymentItemTemplates.$inferInsert;

export type IncomeItemTemplate = typeof incomeItemTemplates.$inferSelect;
export type NewIncomeItemTemplate = typeof incomeItemTemplates.$inferInsert;
