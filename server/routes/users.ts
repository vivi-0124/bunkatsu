import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../../db";
import { users } from "../../db/schemas/auth-schema";

export const usersRoutes = new Hono()
  .get("/users", async (c) => {
    const data = await db.select().from(users);
    return c.json(data);
  })
  .patch(
    "/users/:id/role",
    zValidator(
      "json",
      z.object({
        role: z.enum(["admin", "user"]),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const { role } = c.req.valid("json");
      await db.update(users).set({ role }).where(eq(users.id, id));
      return c.json({ success: true });
    },
  );
