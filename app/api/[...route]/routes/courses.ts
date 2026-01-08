import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { courses } from "@/db/schemas/book";

export const coursesRoutes = new Hono()
  .get("/courses", async (c) => {
    const data = await db.select().from(courses);
    return c.json(data);
  })
  .post(
    "/courses",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        displayName: z.string(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        termDuration: z.number().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(courses).values(values).returning();
      return c.json(data);
    },
  )
  .patch(
    "/courses/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        displayName: z.string().optional(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        termDuration: z.number().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db.update(courses).set(values).where(eq(courses.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/courses/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(courses).where(eq(courses.id, id));
    return c.json({ success: true });
  });
