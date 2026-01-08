import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const installments = sqliteTable("installments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  totalPayments: integer("total_payments").notNull(),
  startDate: text("start_date").notNull(), // 支払い開始月 (YYYY-MM形式)
  amountPerPayment: integer("amount_per_payment").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type Installment = typeof installments.$inferSelect;
export type NewInstallment = typeof installments.$inferInsert;
