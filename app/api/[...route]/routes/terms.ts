import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { terms } from "@/db/schemas/book";

export const termsRoutes = new Hono()
  .get("/terms", async (c) => {
    const data = await db.select().from(terms);
    return c.json(data);
  })
  .post(
    "/terms",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        presentationDate: z.string(),
        totalLessons: z.number(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(terms).values(values).returning();
      return c.json(data);
    },
  )
  .patch(
    "/terms/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        presentationDate: z.string().optional(),
        totalLessons: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db.update(terms).set(values).where(eq(terms.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/terms/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(terms).where(eq(terms.id, id));
    return c.json({ success: true });
  });
