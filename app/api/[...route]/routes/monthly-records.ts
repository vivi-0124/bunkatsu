import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, inArray, gte } from "drizzle-orm";
import { db } from "@/db";
import { fixedCosts } from "@/db/schemas/fixed-cost";
import { monthlyIncomes, monthlyPayments } from "@/db/schemas/monthly-record";
import { recurringItems } from "@/db/schemas/recurring-item";

const MonthlyRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  month: z.string(),
  name: z.string(),
  amount: z.union([z.number(), z.string()]),
  paymentDate: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  isPaid: z.boolean().optional(),
  templateId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const monthlyRecordsRoutes = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/monthly-records",
      request: {
        query: z.object({
          month: z.string().regex(/^\d{4}-\d{2}$/),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                payments: z.array(MonthlyRecordSchema),
                incomes: z.array(MonthlyRecordSchema),
              }),
            },
          },
          description: "Monthly records",
        },
      },
    }),
    async (c) => {
      const { month } = c.req.valid("query");

      // 繰り返し項目の自動生成
      const allRecurring = await db
        .select()
        .from(recurringItems)
        .where(eq(recurringItems.isActive, true));

      if (allRecurring.length > 0) {
        // 既存のtemplateIdを取得して重複チェック
        const existingPayments = await db
          .select({ templateId: monthlyPayments.templateId })
          .from(monthlyPayments)
          .where(
            and(
              eq(monthlyPayments.month, month),
              inArray(
                monthlyPayments.templateId,
                allRecurring
                  .filter((r) => r.type === "payment")
                  .map((r) => r.id),
              ),
            ),
          );
        const existingIncomes = await db
          .select({ templateId: monthlyIncomes.templateId })
          .from(monthlyIncomes)
          .where(
            and(
              eq(monthlyIncomes.month, month),
              inArray(
                monthlyIncomes.templateId,
                allRecurring
                  .filter((r) => r.type === "income")
                  .map((r) => r.id),
              ),
            ),
          );

        const existingPaymentTemplateIds = new Set(
          existingPayments.map((p) => p.templateId),
        );
        const existingIncomeTemplateIds = new Set(
          existingIncomes.map((i) => i.templateId),
        );

        for (const item of allRecurring) {
          if (item.startMonth && item.startMonth > month) continue;

          if (
            item.type === "payment" &&
            !existingPaymentTemplateIds.has(item.id)
          ) {
            await db.insert(monthlyPayments).values({
              userId: item.userId,
              month,
              name: item.name,
              amount: Number(item.amount),
              paymentDate: item.paymentDate || "",
              isPaid: false,
              templateId: item.id,
            });
          } else if (
            item.type === "income" &&
            !existingIncomeTemplateIds.has(item.id)
          ) {
            await db.insert(monthlyIncomes).values({
              userId: item.userId,
              month,
              name: item.name,
              amount: Number(item.amount),
              date: item.paymentDate || "",
              templateId: item.id,
            });
          }
        }
      }

      const payments = await db
        .select()
        .from(monthlyPayments)
        .where(
          and(
            eq(monthlyPayments.month, month),
            eq(monthlyPayments.isExcluded, false)
          )
        );
      const incomes = await db
        .select()
        .from(monthlyIncomes)
        .where(
          and(
            eq(monthlyIncomes.month, month),
            eq(monthlyIncomes.isExcluded, false)
          )
        );
      return c.json({
        payments: payments.map((p) => ({ ...p, isPaid: !!p.isPaid })),
        incomes: incomes.map((i) => ({ ...i })),
      });
    },
  )
  // POST /monthly-records/payment - 単月の支出を追加
  .openapi(
    createRoute({
      method: "post",
      path: "/monthly-records/payment",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                userId: z.string(),
                month: z.string().regex(/^\d{4}-\d{2}$/),
                name: z.string(),
                amount: z.number(),
                paymentDate: z.string().nullable().optional(),
                isPaid: z.boolean().optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ success: z.boolean() }) },
          },
          description: "Payment added",
        },
      },
    }),
    async (c) => {
      const values = c.req.valid("json");
      await db.insert(monthlyPayments).values(values);
      return c.json({ success: true });
    },
  )
  // POST /monthly-records/income - 単月の収入を追加
  .openapi(
    createRoute({
      method: "post",
      path: "/monthly-records/income",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                userId: z.string(),
                month: z.string().regex(/^\d{4}-\d{2}$/),
                name: z.string(),
                amount: z.number(),
                date: z.string().nullable().optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ success: z.boolean() }) },
          },
          description: "Income added",
        },
      },
    }),
    async (c) => {
      const values = c.req.valid("json");
      await db.insert(monthlyIncomes).values(values);
      return c.json({ success: true });
    },
  )
  // POST /monthly-records/generate - 固定費から月次明細を生成Route({
  .openapi(
    createRoute({
      method: "post",
      path: "/monthly-records/generate",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                userId: z.string(),
                month: z.string().regex(/^\d{4}-\d{2}$/),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
                generated: z.object({
                  payments: z.number(),
                  incomes: z.number(),
                }),
              }),
            },
          },
          description: "Generation result",
        },
      },
    }),
    async (c) => {
      const { userId, month } = c.req.valid("json");

      // 固定費一覧を取得
      const allFixedCosts = await db
        .select()
        .from(fixedCosts)
        .where(eq(fixedCosts.userId, userId));

      let totalAmount = 0;
      const [year, monthNum] = month.split("-").map(Number);
      const targetDate = new Date(year, monthNum - 1, 1);

      for (const fc of allFixedCosts) {
        const [startYear, startMonth] = fc.startDate.split("-").map(Number);
        const startDate = new Date(startYear, startMonth - 1, 1);
        if (targetDate < startDate) continue;

        const monthsDiff =
          (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
          (targetDate.getMonth() - startDate.getMonth()) +
          1;
        if (fc.totalPayments !== null && monthsDiff > Number(fc.totalPayments))
          continue;

        totalAmount += Number(fc.amountPerPayment);
      }

      if (totalAmount === 0) {
        return c.json({
          success: true,
          generated: { payments: 0, incomes: 0 },
        });
      }

      // 「固定費」という名前の既存レコードを確認
      const [existingPayment] = await db
        .select()
        .from(monthlyPayments)
        .where(
          and(
            eq(monthlyPayments.userId, userId),
            eq(monthlyPayments.month, month),
            eq(monthlyPayments.name, "固定費"),
          ),
        )
        .limit(1);

      if (existingPayment) {
        // 既存があれば金額を更新
        await db
          .update(monthlyPayments)
          .set({ amount: totalAmount })
          .where(eq(monthlyPayments.id, existingPayment.id));
      } else {
        // なければ新規作成
        await db.insert(monthlyPayments).values({
          userId,
          month,
          name: "固定費",
          amount: totalAmount,
          isPaid: false,
          paymentDate: "",
        });
      }

      return c.json({
        success: true,
        generated: { payments: existingPayment ? 0 : 1, incomes: 0 },
      });
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/monthly-records/template",
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ csv: z.string() }) },
          },
          description: "Template CSV",
        },
      },
    }),
    async (c) => {
      const headers = ["type", "name", "amount", "date"];
      const csv = `${headers.join(",")}\npayment,家賃,50000,27\nincome,給与,250000,25\n`;
      return c.json({ csv });
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/monthly-records/export",
      request: {
        query: z.object({
          month: z.string().regex(/^\d{4}-\d{2}$/),
          userId: z.string(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ csv: z.string() }) },
          },
          description: "Export CSV",
        },
      },
    }),
    async (c) => {
      const { month, userId } = c.req.valid("query");
      const payments = await db
        .select()
        .from(monthlyPayments)
        .where(
          and(
            eq(monthlyPayments.userId, userId),
            eq(monthlyPayments.month, month),
          ),
        );
      const incomes = await db
        .select()
        .from(monthlyIncomes)
        .where(
          and(
            eq(monthlyIncomes.userId, userId),
            eq(monthlyIncomes.month, month),
          ),
        );

      const headers = ["type", "name", "amount", "date", "isPaid"];
      const rows = [headers.join(",")];
      payments.forEach((p) => {
        rows.push(
          `payment,"${p.name}",${p.amount},"${p.paymentDate}",${p.isPaid}`,
        );
      });
      incomes.forEach((i) => {
        rows.push(`income,"${i.name}",${i.amount},"${i.date}",`);
      });
      return c.json({ csv: rows.join("\n") });
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/monthly-records/import",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                csvText: z.string(),
                month: z.string().regex(/^\d{4}-\d{2}$/),
                userId: z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ success: z.boolean() }) },
          },
          description: "Import success",
        },
      },
    }),
    async (c) => {
      const { csvText, month, userId } = c.req.valid("json");
      await db
        .delete(monthlyPayments)
        .where(
          and(
            eq(monthlyPayments.userId, userId),
            eq(monthlyPayments.month, month),
          ),
        );
      await db
        .delete(monthlyIncomes)
        .where(
          and(
            eq(monthlyIncomes.userId, userId),
            eq(monthlyIncomes.month, month),
          ),
        );

      const lines = csvText.trim().split("\n").slice(1);
      for (const line of lines) {
        const parts = line
          .split(",")
          .map((s: string) => s.trim().replace(/^"|"$/g, ""));
        if (parts.length < 3) continue;
        const [type, name, amount, date, isPaid] = parts;
        if (type === "payment") {
          await db.insert(monthlyPayments).values({
            userId,
            month,
            name,
            amount: Number(amount),
            paymentDate: date || "",
            isPaid: isPaid === "true",
          });
        } else if (type === "income") {
          await db.insert(monthlyIncomes).values({
            userId,
            month,
            name,
            amount: Number(amount),
            date: date || "",
          });
        }
      }
      return c.json({ success: true });
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/monthly-records/bulk-delete",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                items: z.array(
                  z.object({
                    type: z.enum(["payment", "income"]),
                    id: z.string(),
                  }),
                ),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ success: z.boolean() }) },
          },
          description: "Bulk delete success",
        },
      },
    }),
    async (c) => {
      const { items } = c.req.valid("json");
      for (const item of items) {
        if (item.type === "payment")
          await db
            .delete(monthlyPayments)
            .where(eq(monthlyPayments.id, item.id));
        else
          await db.delete(monthlyIncomes).where(eq(monthlyIncomes.id, item.id));
      }
      return c.json({ success: true });
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/monthly-records/bulk-set-paid",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                ids: z.array(z.string()),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ success: z.boolean() }) },
          },
          description: "Bulk set paid success",
        },
      },
    }),
    async (c) => {
      const { ids } = c.req.valid("json");
      for (const id of ids) {
        const [record] = await db.select({ isPaid: monthlyPayments.isPaid }).from(monthlyPayments).where(eq(monthlyPayments.id, id));
        if (record) {
          await db
            .update(monthlyPayments)
            .set({ isPaid: !record.isPaid })
            .where(eq(monthlyPayments.id, id));
        }
      }
      return c.json({ success: true });
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/monthly-records/{type}/{id}",
      request: {
        params: z.object({
          type: z.enum(["payment", "income"]),
          id: z.string(),
        }),
        query: z.object({
          scope: z.string().optional(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ success: z.boolean() }) },
          },
          description: "Delete success",
        },
      },
    }),
    async (c) => {
      const { type, id } = c.req.valid("param");
      const { scope = "this_month" } = c.req.valid("query");

      if (type === "payment") {
        const [record] = await db.select().from(monthlyPayments).where(eq(monthlyPayments.id, id));
        if (record) {
          if (record.templateId && scope === "all_future") {
            await db.update(recurringItems).set({ isActive: false }).where(eq(recurringItems.id, record.templateId));
            await db.delete(monthlyPayments).where(and(eq(monthlyPayments.templateId, record.templateId), gte(monthlyPayments.month, record.month)));
          } else if (record.templateId) {
            await db.update(monthlyPayments).set({ isExcluded: true }).where(eq(monthlyPayments.id, id));
          } else {
            await db.delete(monthlyPayments).where(eq(monthlyPayments.id, id));
          }
        }
      } else {
        const [record] = await db.select().from(monthlyIncomes).where(eq(monthlyIncomes.id, id));
        if (record) {
          if (record.templateId && scope === "all_future") {
            await db.update(recurringItems).set({ isActive: false }).where(eq(recurringItems.id, record.templateId));
            await db.delete(monthlyIncomes).where(and(eq(monthlyIncomes.templateId, record.templateId), gte(monthlyIncomes.month, record.month)));
          } else if (record.templateId) {
            await db.update(monthlyIncomes).set({ isExcluded: true }).where(eq(monthlyIncomes.id, id));
          } else {
            await db.delete(monthlyIncomes).where(eq(monthlyIncomes.id, id));
          }
        }
      }
      return c.json({ success: true });
    },
  )
  .patch("/monthly-records/payment/:id/toggle-paid", async (c) => {
    const id = c.req.param("id");
    const [existing] = await db
      .select()
      .from(monthlyPayments)
      .where(eq(monthlyPayments.id, id))
      .limit(1);
    if (!existing) return c.json({ error: "Not found" }, 404);
    await db
      .update(monthlyPayments)
      .set({ isPaid: !existing.isPaid })
      .where(eq(monthlyPayments.id, id));
    return c.json({ success: true });
  })
  .patch("/monthly-records/payment/:id", async (c) => {
    const id = c.req.param("id");
    const { scope, ...body } = await c.req.json();

    if (scope === "all_future") {
      const [record] = await db.select().from(monthlyPayments).where(eq(monthlyPayments.id, id));
      if (record?.templateId) {
        await db.update(recurringItems).set({
          name: body.name ?? record.name,
          amount: body.amount ?? record.amount,
          paymentDate: body.paymentDate ?? record.paymentDate
        }).where(eq(recurringItems.id, record.templateId));
        await db.update(monthlyPayments).set({
          name: body.name ?? record.name,
          amount: body.amount ?? record.amount,
          paymentDate: body.paymentDate ?? record.paymentDate
        }).where(and(eq(monthlyPayments.templateId, record.templateId), gte(monthlyPayments.month, record.month)));
      }
    }
    
    await db
      .update(monthlyPayments)
      .set(body)
      .where(eq(monthlyPayments.id, id));
    return c.json({ success: true });
  })
  .patch("/monthly-records/income/:id", async (c) => {
    const id = c.req.param("id");
    const { scope, ...body } = await c.req.json();

    if (scope === "all_future") {
      const [record] = await db.select().from(monthlyIncomes).where(eq(monthlyIncomes.id, id));
      if (record?.templateId) {
        await db.update(recurringItems).set({
          name: body.name ?? record.name,
          amount: body.amount ?? record.amount,
          paymentDate: body.date ?? record.date
        }).where(eq(recurringItems.id, record.templateId));
        await db.update(monthlyIncomes).set({
          name: body.name ?? record.name,
          amount: body.amount ?? record.amount,
          date: body.date ?? record.date
        }).where(and(eq(monthlyIncomes.templateId, record.templateId), gte(monthlyIncomes.month, record.month)));
      }
    }

    await db.update(monthlyIncomes).set(body).where(eq(monthlyIncomes.id, id));
    return c.json({ success: true });
  });
