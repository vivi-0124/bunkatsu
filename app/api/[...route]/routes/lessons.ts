import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { lessons } from "@/db/schemas/book";

export const lessonsRoutes = new Hono()
  .get("/lessons", async (c) => {
    const data = await db.select().from(lessons);
    return c.json(data);
  })
  .post(
    "/lessons",
    zValidator(
      "json",
      z.object({
        termId: z.string(),
        courseType: z.enum(["fuchu", "fuchu_advance"]),
        courseId: z.string().optional(),
        studentIds: z.string().optional(),
        tutorIds: z.string().optional(),
        lessonSlotId: z.string().optional(),
        manualLocation: z.string().optional(),
        lessonNumber: z.number(),
        startTime: z.number(),
        endTime: z.number(),
        status: z.enum(["requested", "confirmed", "completed"]).optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db
        .insert(lessons)
        .values({
          ...values,
          startTime: new Date(values.startTime),
          endTime: new Date(values.endTime),
        })
        .returning();
      return c.json(data);
    },
  )
  .patch(
    "/lessons/:id",
    zValidator(
      "json",
      z.object({
        termId: z.string().optional(),
        courseType: z.enum(["fuchu", "fuchu_advance"]).optional(),
        courseId: z.string().optional(),
        studentIds: z.string().optional(),
        tutorIds: z.string().optional(),
        lessonSlotId: z.string().optional(),
        manualLocation: z.string().optional(),
        lessonNumber: z.number().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        status: z.enum(["requested", "confirmed", "completed"]).optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const { startTime, endTime, ...rest } = c.req.valid("json");
      const updateValues: Partial<typeof lessons.$inferInsert> = { ...rest };
      if (startTime) updateValues.startTime = new Date(startTime);
      if (endTime) updateValues.endTime = new Date(endTime);
      await db.update(lessons).set(updateValues).where(eq(lessons.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/lessons/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(lessons).where(eq(lessons.id, id));
    return c.json({ success: true });
  });
