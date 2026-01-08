import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { areas, lessonSlots, terms } from "@/db/schemas/book";

export const lessonSlotsRoutes = new Hono()
  .get("/lesson-slots", async (c) => {
    const data = await db
      .select({
        id: lessonSlots.id,
        areaId: lessonSlots.areaId,
        areaName: areas.name,
        termId: lessonSlots.termId,
        termName: terms.name,
        courseType: lessonSlots.courseType,
        location: lessonSlots.location,
        timeSlots: lessonSlots.timeSlots,
        isActive: lessonSlots.isActive,
      })
      .from(lessonSlots)
      .leftJoin(areas, eq(lessonSlots.areaId, areas.id))
      .leftJoin(terms, eq(lessonSlots.termId, terms.id));
    return c.json(data);
  })
  .post(
    "/lesson-slots",
    zValidator(
      "json",
      z.object({
        areaId: z.string(),
        termId: z.string(),
        courseType: z.enum(["fuchu", "fuchu_advance"]),
        location: z.string(),
        timeSlots: z.array(
          z.object({
            dayOfWeek: z.number(),
            startTime: z.string(),
            endTime: z.string(),
            capacity: z.number(),
          }),
        ),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(lessonSlots).values(values).returning();
      return c.json(data);
    },
  )
  .patch(
    "/lesson-slots/:id",
    zValidator(
      "json",
      z.object({
        areaId: z.string().optional(),
        termId: z.string().optional(),
        courseType: z.enum(["fuchu", "fuchu_advance"]).optional(),
        location: z.string().optional(),
        timeSlots: z
          .array(
            z.object({
              dayOfWeek: z.number(),
              startTime: z.string(),
              endTime: z.string(),
              capacity: z.number(),
            }),
          )
          .optional(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db.update(lessonSlots).set(values).where(eq(lessonSlots.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/lesson-slots/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(lessonSlots).where(eq(lessonSlots.id, id));
    return c.json({ success: true });
  });
