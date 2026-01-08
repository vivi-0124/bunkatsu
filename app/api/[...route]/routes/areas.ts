import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { areas } from "@/db/schemas/book";

export const areasRoutes = new Hono()
  .get("/areas", async (c) => {
    const data = await db.select().from(areas);
    return c.json(data);
  })
  .post(
    "/areas",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(areas).values(values).returning();
      return c.json(data);
    },
  )
  .patch(
    "/areas/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db.update(areas).set(values).where(eq(areas.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/areas/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(areas).where(eq(areas.id, id));
    return c.json({ success: true });
  });
