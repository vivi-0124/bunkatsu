import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { studentStageProgress } from "@/db/schemas/book";

export const studentStageProgressRoutes = new Hono()
  .get("/student-stage-progress", async (c) => {
    const data = await db.select().from(studentStageProgress);
    return c.json(data);
  })
  .post(
    "/student-stage-progress",
    zValidator(
      "json",
      z.object({
        studentId: z.string(),
        stageId: z.string(),
        courseType: z.enum(["fuchu", "fuchu_advance"]),
        note: z.string().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db
        .insert(studentStageProgress)
        .values(values)
        .returning();
      return c.json(data);
    },
  );
