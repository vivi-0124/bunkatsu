import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { dayNotes } from "@/db/schemas/book";

export const dayNotesRoutes = new Hono()
  .get("/day-notes", async (c) => {
    const data = await db.select().from(dayNotes);
    return c.json(data);
  })
  .post(
    "/day-notes",
    zValidator(
      "json",
      z.object({
        targetDate: z.string(),
        note: z.string().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(dayNotes).values(values).returning();
      return c.json(data);
    },
  );
