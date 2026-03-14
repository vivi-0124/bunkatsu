import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const monthlyPayments = sqliteTable("monthly_payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  month: text("month").notNull(), // YYYY-MM
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  paymentDate: text("payment_date"), // MM/DD or arbitrary text
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),
  templateId: text("template_id"), // 項目テンプレートへの参照（任意）
  isExcluded: integer("is_excluded", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});


export const monthlyIncomes = sqliteTable("monthly_incomes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  month: text("month").notNull(), // YYYY-MM
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  date: text("date"), // MM/DD or arbitrary text
  templateId: text("template_id"), // 項目テンプレートへの参照（任意）
  isExcluded: integer("is_excluded", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type MonthlyPayment = typeof monthlyPayments.$inferSelect;
export type NewMonthlyPayment = typeof monthlyPayments.$inferInsert;

export type MonthlyIncome = typeof monthlyIncomes.$inferSelect;
export type NewMonthlyIncome = typeof monthlyIncomes.$inferInsert;
