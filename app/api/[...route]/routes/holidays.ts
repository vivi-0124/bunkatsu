import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { holidays } from "@/db/schemas/book";

export const holidaysRoutes = new Hono()
  .get("/holidays", async (c) => {
    const data = await db.select().from(holidays);
    return c.json(data);
  })
  .post(
    "/holidays",
    zValidator(
      "json",
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(holidays).values(values).returning();
      return c.json(data);
    },
  );
