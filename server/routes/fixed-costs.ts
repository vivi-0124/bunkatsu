import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { fixedCosts } from "../../db/schemas/fixed-cost.js";

// 数値バリデーションの上限（JavaScript の安全な整数の最大値）
const MAX_AMOUNT = Number.MAX_SAFE_INTEGER;
const MIN_AMOUNT = 0;
const MAX_PAYMENTS = 999; // 分割回数の現実的な上限
const MIN_PAYMENTS = 1;

export const fixedCostsRoutes = new OpenAPIHono()
  // GET /dashboard/fixed-costs - List all fixed costs for a user
  .openapi(
    createRoute({
      method: "get",
      path: "/fixed-costs",
      request: {
        query: z.object({
          userId: z
            .string()
            .openapi({ param: { name: "userId", in: "query" } }),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  id: z.string(),
                  userId: z.string(),
                  name: z.string(),
                  totalPayments: z.union([z.number(), z.string()]).nullable(),
                  startDate: z.string(),
                  amountPerPayment: z.union([z.number(), z.string()]),
                  totalAmount: z.union([z.number(), z.string()]).nullable(),
                  createdAt: z.string(),
                  updatedAt: z.string(),
                }),
              ),
            },
          },
          description: "List of fixed costs",
        },
      },
    }),
    async (c) => {
      const { userId } = c.req.valid("query");
      const data = await db
        .select()
        .from(fixedCosts)
        .where(eq(fixedCosts.userId, userId));
      return c.json(data);
    },
  )
  // POST /dashboard/fixed-costs - Create a new fixed cost
  .openapi(
    createRoute({
      method: "post",
      path: "/fixed-costs",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                userId: z.string(),
                name: z
                  .string()
                  .min(1, "項目名は必須です")
                  .max(100, "項目名は100文字以内で入力してください"),
                totalPayments: z
                  .number()
                  .int()
                  .min(MIN_PAYMENTS, "支払い回数は1以上で入力してください")
                  .max(
                    MAX_PAYMENTS,
                    `支払い回数は${MAX_PAYMENTS}以下で入力してください`,
                  )
                  .nullable()
                  .optional(),
                startDate: z
                  .string()
                  .regex(
                    /^\d{4}-\d{2}$/,
                    "開始月はYYYY-MM形式で入力してください",
                  ),
                amountPerPayment: z
                  .number()
                  .int()
                  .min(MIN_AMOUNT, "金額は0以上で入力してください")
                  .max(MAX_AMOUNT, "金額の値が大きすぎます"),
                totalAmount: z
                  .number()
                  .int()
                  .min(MIN_AMOUNT, "総額は0以上で入力してください")
                  .max(MAX_AMOUNT, "総額の値が大きすぎます")
                  .nullable()
                  .optional(),
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
                id: z.string(),
                userId: z.string(),
                name: z.string(),
                totalPayments: z.union([z.number(), z.string()]).nullable(),
                startDate: z.string(),
                amountPerPayment: z.union([z.number(), z.string()]),
                totalAmount: z.union([z.number(), z.string()]).nullable(),
                createdAt: z.string(),
                updatedAt: z.string(),
              }),
            },
          },
          description: "Created fixed cost",
        },
      },
    }),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(fixedCosts).values(values).returning();
      return c.json(data);
    },
  )
  // PATCH /dashboard/fixed-costs/:id - Update a fixed cost
  .openapi(
    createRoute({
      method: "patch",
      path: "/fixed-costs/{id}",
      request: {
        params: z.object({
          id: z.string().openapi({ param: { name: "id", in: "path" } }),
        }),
        body: {
          content: {
            "application/json": {
              schema: z.object({
                name: z
                  .string()
                  .min(1, "項目名は必須です")
                  .max(200, "項目名は200文字以内で入力してください")
                  .optional(),
                totalPayments: z
                  .number()
                  .int()
                  .min(MIN_PAYMENTS, "支払い回数は1以上で入力してください")
                  .max(
                    MAX_PAYMENTS,
                    `支払い回数は${MAX_PAYMENTS}以下で入力してください`,
                  )
                  .nullable()
                  .optional(),
                startDate: z
                  .string()
                  .regex(
                    /^\d{4}-\d{2}$/,
                    "開始月はYYYY-MM形式で入力してください",
                  )
                  .optional(),
                amountPerPayment: z
                  .number()
                  .int()
                  .min(MIN_AMOUNT, "金額は0以上で入力してください")
                  .max(MAX_AMOUNT, "金額の値が大きすぎます")
                  .optional(),
                totalAmount: z
                  .number()
                  .int()
                  .min(MIN_AMOUNT, "総額は0以上で入力してください")
                  .max(MAX_AMOUNT, "総額の値が大きすぎます")
                  .optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ success: z.boolean() }),
            },
          },
          description: "Update success",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");
      await db
        .update(fixedCosts)
        .set({ ...values, updatedAt: new Date().toISOString() })
        .where(eq(fixedCosts.id, id));
      return c.json({ success: true });
    },
  )
  // DELETE /dashboard/fixed-costs/:id - Delete a fixed cost
  .openapi(
    createRoute({
      method: "delete",
      path: "/fixed-costs/{id}",
      request: {
        params: z.object({
          id: z.string().openapi({ param: { name: "id", in: "path" } }),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ success: z.boolean() }),
            },
          },
          description: "Delete success",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      await db.delete(fixedCosts).where(eq(fixedCosts.id, id));
      return c.json({ success: true });
    },
  )
  // GET /dashboard/fixed-costs/export - Export fixed costs as CSV
  .openapi(
    createRoute({
      method: "get",
      path: "/fixed-costs/export",
      request: {
        query: z.object({
          userId: z
            .string()
            .openapi({ param: { name: "userId", in: "query" } }),
        }),
      },
      responses: {
        200: {
          description: "CSV Export",
        },
      },
    }),
    async (c) => {
      const { userId } = c.req.valid("query");
      const data = await db
        .select()
        .from(fixedCosts)
        .where(eq(fixedCosts.userId, userId));

      const headers = [
        "id",
        "name",
        "totalPayments",
        "startDate",
        "amountPerPayment",
        "totalAmount",
      ];
      const csvRows = [headers.join(",")];

      for (const row of data) {
        csvRows.push(
          [
            row.id,
            `"${row.name.replace(/"/g, '""')}"`,
            row.totalPayments ?? "",
            row.startDate,
            row.amountPerPayment,
            row.totalAmount ?? "",
          ].join(","),
        );
      }

      const csvContent = csvRows.join("\n");
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="fixed_costs_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    },
  )
  // GET /dashboard/fixed-costs/template - Download CSV template
  .openapi(
    createRoute({
      method: "get",
      path: "/fixed-costs/template",
      responses: {
        200: {
          description: "CSV Template",
        },
      },
    }),
    async () => {
      const headers = [
        "id",
        "name",
        "totalPayments",
        "startDate",
        "amountPerPayment",
        "totalAmount",
      ];
      // サンプル行
      const sampleRows = [
        // 新規追加の例（idは空欄）
        ',"サンプル固定費（無期限）",,2026-01,3000,',
        ',"サンプル分割払い（期限あり）",12,2026-01,1000,12000',
      ];
      const comment =
        "# 注意: 新規追加の場合はidを空欄にしてください。支払い回数が空の場合は無期限となります。";
      const csvContent = `${comment}\n${headers.join(",")}\n${sampleRows.join("\n")}\n`;
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="fixed_costs_template.csv"',
        },
      });
    },
  )
  // POST /dashboard/fixed-costs/import - Import fixed costs from CSV
  .openapi(
    createRoute({
      method: "post",
      path: "/fixed-costs/import",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                userId: z.string(),
                csvData: z.string(),
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
                inserted: z.number(),
                updated: z.number(),
                errors: z.array(z.string()),
              }),
            },
          },
          description: "Import result",
        },
        400: {
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
                error: z.string(),
              }),
            },
          },
          description: "Bad Request",
        },
      },
    }),
    async (c) => {
      const { userId, csvData } = c.req.valid("json");
      // コメント行（#で始まる）を除外
      const lines = csvData
        .trim()
        .split("\n")
        .filter((line) => !line.trim().startsWith("#"));

      if (lines.length < 2) {
        return c.json({ success: false, error: "No data rows found" }, 400);
      }

      const headerLine = lines[0];
      const expectedHeaders = [
        "id",
        "name",
        "totalPayments",
        "startDate",
        "amountPerPayment",
        "totalAmount",
      ];
      const headers = headerLine
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));

      // Validate headers
      const headerMatch = expectedHeaders.every((h, i) => headers[i] === h);
      if (!headerMatch) {
        return c.json({ success: false, error: "Invalid CSV headers" }, 400);
      }

      const insertedRows = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line (handle quoted values)
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        if (values.length !== 6) {
          errors.push(`Row ${i + 1}: Invalid number of columns`);
          continue;
        }

        const [
          idStr,
          name,
          totalPaymentsStr,
          startDate,
          amountPerPaymentStr,
          totalAmountStr,
        ] = values;
        const id = idStr ? idStr.trim() : null;

        const totalPayments = totalPaymentsStr
          ? Number.parseInt(totalPaymentsStr, 10)
          : null;
        const amountPerPayment = Number.parseInt(amountPerPaymentStr, 10);
        const totalAmount = totalAmountStr
          ? Number.parseInt(totalAmountStr, 10)
          : null;

        if (
          !name ||
          (totalPaymentsStr && Number.isNaN(totalPayments)) ||
          !startDate ||
          Number.isNaN(amountPerPayment)
        ) {
          errors.push(`Row ${i + 1}: Invalid data format`);
          continue;
        }

        try {
          if (id) {
            // Update existing record
            const [updated] = await db
              .update(fixedCosts)
              .set({
                name,
                totalPayments,
                startDate,
                amountPerPayment,
                totalAmount,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(fixedCosts.id, id))
              .returning();

            if (updated) {
              insertedRows.push({ id, name, updated: true });
            } else {
              // ID provided but not found -> Error (do not insert)
              errors.push(
                `Row ${i + 1}: ID ${id} not found in database. Cannot update.`,
              );
            }
          } else {
            // Insert new record
            const [inserted] = await db
              .insert(fixedCosts)
              .values({
                userId,
                name,
                totalPayments,
                startDate,
                amountPerPayment,
                totalAmount,
              })
              .returning();
            insertedRows.push(inserted);
          }
        } catch (_err) {
          errors.push(`Row ${i + 1}: Database error`);
        }
      }

      const newCount = insertedRows.filter((r) => !("updated" in r)).length;
      const updateCount = insertedRows.filter((r) => "updated" in r).length;

      return c.json(
        {
          success: true,
          inserted: newCount,
          updated: updateCount,
          errors,
        },
        200,
      );
    },
  );
