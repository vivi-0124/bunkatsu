import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { installments } from "@/db/schemas/installment";

// 数値バリデーションの上限（JavaScript の安全な整数の最大値）
const MAX_AMOUNT = Number.MAX_SAFE_INTEGER;
const MIN_AMOUNT = 0;
const MAX_PAYMENTS = 999; // 分割回数の現実的な上限
const MIN_PAYMENTS = 1;

export const installmentsRoutes = new OpenAPIHono()
  // GET /dashboard/installments - List all installments for a user
  .openapi(
    createRoute({
      method: "get",
      path: "/dashboard/installments",
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
                  totalPayments: z.number(),
                  startDate: z.string(),
                  amountPerPayment: z.number(),
                  totalAmount: z.number().nullable(),
                  createdAt: z.string(),
                  updatedAt: z.string(),
                }),
              ),
            },
          },
          description: "List of installments",
        },
      },
    }),
    async (c) => {
      const { userId } = c.req.valid("query");
      const data = await db
        .select()
        .from(installments)
        .where(eq(installments.userId, userId));
      return c.json(data);
    },
  )
  // POST /dashboard/installments - Create a new installment
  .openapi(
    createRoute({
      method: "post",
      path: "/dashboard/installments",
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
                  .min(MIN_PAYMENTS, "分割回数は1以上で入力してください")
                  .max(
                    MAX_PAYMENTS,
                    `分割回数は${MAX_PAYMENTS}以下で入力してください`,
                  ),
                startDate: z
                  .string()
                  .regex(
                    /^\d{4}-\d{2}$/,
                    "開始月はYYYY-MM形式で入力してください",
                  ),
                amountPerPayment: z
                  .number()
                  .int()
                  .min(MIN_AMOUNT, "月額は0以上で入力してください")
                  .max(MAX_AMOUNT, "月額の値が大きすぎます"),
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
                totalPayments: z.number(),
                startDate: z.string(),
                amountPerPayment: z.number(),
                totalAmount: z.number().nullable(),
                createdAt: z.string(),
                updatedAt: z.string(),
              }),
            },
          },
          description: "Created installment",
        },
      },
    }),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(installments).values(values).returning();
      return c.json(data);
    },
  )
  // PATCH /dashboard/installments/:id - Update an installment
  .openapi(
    createRoute({
      method: "patch",
      path: "/dashboard/installments/{id}",
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
                  .min(MIN_PAYMENTS, "分割回数は1以上で入力してください")
                  .max(
                    MAX_PAYMENTS,
                    `分割回数は${MAX_PAYMENTS}以下で入力してください`,
                  )
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
                  .min(MIN_AMOUNT, "月額は0以上で入力してください")
                  .max(MAX_AMOUNT, "月額の値が大きすぎます")
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
        .update(installments)
        .set({ ...values, updatedAt: new Date().toISOString() })
        .where(eq(installments.id, id));
      return c.json({ success: true });
    },
  )
  // DELETE /dashboard/installments/:id - Delete an installment
  .openapi(
    createRoute({
      method: "delete",
      path: "/dashboard/installments/{id}",
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
      await db.delete(installments).where(eq(installments.id, id));
      return c.json({ success: true });
    },
  )
  // GET /dashboard/installments/export - Export installments as CSV
  .openapi(
    createRoute({
      method: "get",
      path: "/dashboard/installments/export",
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
        .from(installments)
        .where(eq(installments.userId, userId));

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
            row.totalPayments,
            row.startDate,
            row.amountPerPayment,
            row.totalAmount,
          ].join(","),
        );
      }

      const csvContent = csvRows.join("\n");
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="installments_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    },
  )
  // GET /dashboard/installments/template - Download CSV template
  .openapi(
    createRoute({
      method: "get",
      path: "/dashboard/installments/template",
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
        ',"サンプル商品（新規）",12,2026-01,1000,12000',
      ];
      const comment = "# 注意: 新規追加の場合はidを空欄にしてください。";
      const csvContent = `${comment}\n${headers.join(",")}\n${sampleRows.join("\n")}\n`;
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="installments_template.csv"',
        },
      });
    },
  )
  // POST /dashboard/installments/import - Import installments from CSV
  .openapi(
    createRoute({
      method: "post",
      path: "/dashboard/installments/import",
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
        const totalPayments = Number.parseInt(totalPaymentsStr, 10);
        const amountPerPayment = Number.parseInt(amountPerPaymentStr, 10);
        const totalAmount = Number.parseInt(totalAmountStr, 10);

        if (
          !name ||
          Number.isNaN(totalPayments) ||
          !startDate ||
          Number.isNaN(amountPerPayment) ||
          Number.isNaN(totalAmount)
        ) {
          errors.push(`Row ${i + 1}: Invalid data format`);
          continue;
        }

        try {
          if (id) {
            // Update existing record
            const [updated] = await db
              .update(installments)
              .set({
                name,
                totalPayments,
                startDate,
                amountPerPayment,
                totalAmount,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(installments.id, id))
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
              .insert(installments)
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
