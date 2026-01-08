import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { reflections } from "@/db/schemas/book";

export const reflectionsRoutes = new Hono()
  .get("/reflections", async (c) => {
    const data = await db.select().from(reflections);
    return c.json(data);
  })
  .post(
    "/reflections",
    zValidator(
      "json",
      z.object({
        lessonId: z.string(),
        studentId: z.string(),
        tutorId: z.string(),
        stageId: z.string().optional(),
        focusScore: z.number().optional(),
        reflection: z.string().optional(),
        internalNote: z.string().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(reflections).values(values).returning();
      return c.json(data);
    },
  );
