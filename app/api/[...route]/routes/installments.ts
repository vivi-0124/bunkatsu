import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { installments } from "@/db/schemas/installment";

export const installmentsRoutes = new Hono()
  // GET /installments - List all installments for a user
  .get(
    "/installments",
    zValidator(
      "query",
      z.object({
        userId: z.string(),
      }),
    ),
    async (c) => {
      const { userId } = c.req.valid("query");
      const data = await db
        .select()
        .from(installments)
        .where(eq(installments.userId, userId));
      return c.json(data);
    },
  )
  // POST /installments - Create a new installment
  .post(
    "/installments",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        name: z.string(),
        totalPayments: z.number(),
        startDate: z.string(), // YYYY-MM形式
        amountPerPayment: z.number(),
        totalAmount: z.number(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(installments).values(values).returning();
      return c.json(data);
    },
  )
  // PATCH /installments/:id - Update an installment
  .patch(
    "/installments/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        totalPayments: z.number().optional(),
        startDate: z.string().optional(),
        amountPerPayment: z.number().optional(),
        totalAmount: z.number().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db
        .update(installments)
        .set({ ...values, updatedAt: new Date().toISOString() })
        .where(eq(installments.id, Number(id)));
      return c.json({ success: true });
    },
  )
  // DELETE /installments/:id - Delete an installment
  .delete("/installments/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(installments).where(eq(installments.id, Number(id)));
    return c.json({ success: true });
  })
  // GET /installments/export - Export installments as CSV
  .get(
    "/installments/export",
    zValidator(
      "query",
      z.object({
        userId: z.string(),
      }),
    ),
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
  // GET /installments/template - Download CSV template
  .get("/installments/template", async () => {
    const headers = [
      "id",
      "name",
      "totalPayments",
      "startDate",
      "amountPerPayment",
      "totalAmount",
    ];
    const csvContent = `${headers.join(",")}\n`;
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="installments_template.csv"',
      },
    });
  })
  // POST /installments/import - Import installments from CSV
  .post(
    "/installments/import",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        csvData: z.string(),
      }),
    ),
    async (c) => {
      const { userId, csvData } = c.req.valid("json");
      const lines = csvData.trim().split("\n");

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
        const id = idStr ? Number.parseInt(idStr, 10) : null;
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
          if (id && !Number.isNaN(id)) {
            // Update existing record
            await db
              .update(installments)
              .set({
                name,
                totalPayments,
                startDate,
                amountPerPayment,
                totalAmount,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(installments.id, id));
            insertedRows.push({ id, name, updated: true });
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

      return c.json({
        success: true,
        inserted: newCount,
        updated: updateCount,
        errors,
      });
    },
  );
