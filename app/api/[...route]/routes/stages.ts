import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { stages } from "@/db/schemas/book";

export const stagesRoutes = new Hono()
  .get("/stages", async (c) => {
    const data = await db.select().from(stages);
    return c.json(data);
  })
  .post(
    "/stages",
    zValidator(
      "json",
      z.object({
        courseType: z.enum(["fuchu", "fuchu_advance"]),
        stageNumber: z.string(),
        title: z.string(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(stages).values(values).returning();
      return c.json(data);
    },
  );
