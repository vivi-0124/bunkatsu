import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { monthlyIncomes, monthlyPayments } from "@/db/schemas/monthly-record";

// CSVのパースロジック
const parseMonthlyCSV = (csvText: string, month: string, userId: string) => {
  const lines = csvText.split(/\r?\n/);
  const payments: (typeof monthlyPayments.$inferInsert)[] = [];
  const incomes: (typeof monthlyIncomes.$inferInsert)[] = [];

  let mode: "none" | "expenditure" | "income" = "none";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("支出")) {
      mode = "expenditure";
      i++; // ヘッダーをスキップ
      continue;
    }
    if (line.startsWith("収入")) {
      mode = "income";
      i++; // ヘッダーをスキップ
      continue;
    }

    const cols = line.split(",").map((c) => c.replace(/"/g, "").trim());

    if (mode === "expenditure") {
      // 合計行や空の行を検知
      if (cols[1] === "合計" || !cols[1]) {
        mode = "none";
        continue;
      }
      const paymentDate = cols[0];
      const name = cols[1];
      const amountStr = cols[2].replace(/[^\d]/g, "");
      const isPaid = cols[3]?.toUpperCase() === "TRUE";

      if (name && amountStr) {
        payments.push({
          userId,
          month,
          name,
          amount: parseInt(amountStr, 10),
          paymentDate,
          isPaid,
        });
      }
    } else if (mode === "income") {
      if (cols[1] === "合計" || !cols[1]) {
        mode = "none";
        continue;
      }
      const date = cols[0];
      const name = cols[1];
      const amountStr = cols[2].replace(/[^\d]/g, "");

      if (name && amountStr) {
        incomes.push({
          userId,
          month,
          name,
          amount: parseInt(amountStr, 10),
          date,
        });
      }
    }
  }

  return { payments, incomes };
};

export const monthlyRecordsRoutes = new Hono()
  .get(
    "/monthly-records",
    zValidator("query", z.object({ month: z.string() })),
    async (c) => {
      const { month } = c.req.valid("query");
      // TODO: 本来的には auth middleware で userId を取得すべきだが、
      // 既存の installments.ts に倣い、一旦固定 or クエリにするか検討。
      // ここでは、一旦全てのユーザーを取得する形にし、フロントで制御するか、
      // ダミーの userId (後で本番用に修正) を使用する。
      // 他のファイルを確認したところ、userId は auth から取得しているようなので、
      // 後ほど auth 連携を確認する。

      const payments = await db
        .select()
        .from(monthlyPayments)
        .where(eq(monthlyPayments.month, month));
      const incomes = await db
        .select()
        .from(monthlyIncomes)
        .where(eq(monthlyIncomes.month, month));

      return c.json({ payments, incomes });
    },
  )
  .post(
    "/monthly-records/import",
    zValidator(
      "json",
      z.object({
        csvText: z.string(),
        month: z.string(),
        userId: z.string(),
      }),
    ),
    async (c) => {
      const { csvText, month, userId } = c.req.valid("json");
      const { payments, incomes } = parseMonthlyCSV(csvText, month, userId);

      // トランザクションで既存のその月のデータを消してから入れるか、追加するか
      // ユーザーの利便性を考え、一旦既存のその月のデータを削除してからインポートする
      await db.transaction(async (tx) => {
        await tx
          .delete(monthlyPayments)
          .where(
            and(
              eq(monthlyPayments.month, month),
              eq(monthlyPayments.userId, userId),
            ),
          );
        await tx
          .delete(monthlyIncomes)
          .where(
            and(
              eq(monthlyIncomes.month, month),
              eq(monthlyIncomes.userId, userId),
            ),
          );

        if (payments.length > 0) {
          await tx.insert(monthlyPayments).values(payments);
        }
        if (incomes.length > 0) {
          await tx.insert(monthlyIncomes).values(incomes);
        }
      });

      return c.json({ success: true, count: payments.length + incomes.length });
    },
  )
  .delete(
    "/monthly-records/:type/:id",
    zValidator(
      "param",
      z.object({
        type: z.enum(["payment", "income"]),
        id: z.string(),
      }),
    ),
    async (c) => {
      const { type, id } = c.req.valid("param");
      if (type === "payment") {
        await db.delete(monthlyPayments).where(eq(monthlyPayments.id, id));
      } else {
        await db.delete(monthlyIncomes).where(eq(monthlyIncomes.id, id));
      }
      return c.json({ success: true });
    },
  )
  // 支出の手動追加
  .post(
    "/monthly-records/payment",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        month: z.string(),
        name: z.string(),
        amount: z.number(),
        paymentDate: z.string().optional(),
        isPaid: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const data = c.req.valid("json");
      const result = await db
        .insert(monthlyPayments)
        .values({
          userId: data.userId,
          month: data.month,
          name: data.name,
          amount: data.amount,
          paymentDate: data.paymentDate ?? "",
          isPaid: data.isPaid ?? false,
        })
        .returning();
      return c.json({ success: true, data: result[0] });
    },
  )
  // 収入の手動追加
  .post(
    "/monthly-records/income",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        month: z.string(),
        name: z.string(),
        amount: z.number(),
        date: z.string().optional(),
      }),
    ),
    async (c) => {
      const data = c.req.valid("json");
      const result = await db
        .insert(monthlyIncomes)
        .values({
          userId: data.userId,
          month: data.month,
          name: data.name,
          amount: data.amount,
          date: data.date ?? "",
        })
        .returning();
      return c.json({ success: true, data: result[0] });
    },
  )
  // CSVエクスポート
  .get(
    "/monthly-records/export",
    zValidator(
      "query",
      z.object({
        month: z.string(),
        userId: z.string(),
      }),
    ),
    async (c) => {
      const { month, userId } = c.req.valid("query");
      const payments = await db
        .select()
        .from(monthlyPayments)
        .where(
          and(
            eq(monthlyPayments.month, month),
            eq(monthlyPayments.userId, userId),
          ),
        );
      const incomes = await db
        .select()
        .from(monthlyIncomes)
        .where(
          and(
            eq(monthlyIncomes.month, month),
            eq(monthlyIncomes.userId, userId),
          ),
        );

      // CSV生成
      let csv = "支出\r\n";
      csv += "支払日,項目名,金額,支払済み\r\n";
      for (const p of payments) {
        csv += `${p.paymentDate ?? ""},${p.name},${p.amount},${p.isPaid ? "TRUE" : "FALSE"}\r\n`;
      }
      const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);
      csv += `,合計,${totalPayments},\r\n`;
      csv += "\r\n";
      csv += "収入\r\n";
      csv += "日付,項目名,金額\r\n";
      for (const i of incomes) {
        csv += `${i.date ?? ""},${i.name},${i.amount}\r\n`;
      }
      const totalIncomes = incomes.reduce((acc, i) => acc + i.amount, 0);
      csv += `,合計,${totalIncomes}\r\n`;

      return c.json({ csv });
    },
  )
  // テンプレートCSV
  .get("/monthly-records/template", (c) => {
    const template = `支出\r
支払日,項目名,金額,支払済み\r
10/27,楽天カード,10000,TRUE\r
10/27,光熱費,5000,FALSE\r
,合計,,\r
\r
収入\r
日付,項目名,金額\r
10/15,給与,200000\r
,合計,\r
`;
    return c.json({ csv: template });
  })
  // 支出の編集
  .patch(
    "/monthly-records/payment/:id",
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        amount: z.number().optional(),
        paymentDate: z.string().optional(),
        isPaid: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const result = await db
        .update(monthlyPayments)
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(monthlyPayments.id, id))
        .returning();
      return c.json({ success: true, data: result[0] });
    },
  )
  // 収入の編集
  .patch(
    "/monthly-records/income/:id",
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        amount: z.number().optional(),
        date: z.string().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const result = await db
        .update(monthlyIncomes)
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(monthlyIncomes.id, id))
        .returning();
      return c.json({ success: true, data: result[0] });
    },
  )
  // 支払済みトグル
  .patch(
    "/monthly-records/payment/:id/toggle-paid",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id } = c.req.valid("param");
      // 現在の状態を取得
      const current = await db
        .select()
        .from(monthlyPayments)
        .where(eq(monthlyPayments.id, id))
        .limit(1);
      if (current.length === 0) {
        return c.json({ success: false, error: "Not found" }, 404);
      }
      const result = await db
        .update(monthlyPayments)
        .set({
          isPaid: !current[0].isPaid,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(monthlyPayments.id, id))
        .returning();
      return c.json({ success: true, data: result[0] });
    },
  );
