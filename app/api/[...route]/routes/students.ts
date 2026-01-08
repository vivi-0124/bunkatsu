import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import { areas, students } from "@/db/schemas/book";

export const studentsRoutes = new Hono()
  .get(
    "/students",
    zValidator(
      "query",
      z.object({
        parentId: z.string().optional(),
      }),
    ),
    async (c) => {
      const { parentId } = c.req.valid("query");
      const baseQuery = db
        .select({
          id: students.id,
          name: students.name,
          school: students.school,
          grade: students.grade,
          areaId: students.areaId,
          areaName: areas.name,
          courseType: students.courseType,
          birthDate: students.birthDate,
          parentId: students.parentId,
        })
        .from(students)
        .leftJoin(areas, eq(students.areaId, areas.id));

      const data = await (parentId
        ? baseQuery.where(eq(students.parentId, parentId))
        : baseQuery);
      return c.json(data);
    },
  )
  .post(
    "/students",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        birthDate: z.string(),
        school: z.string(),
        parentId: z.string(),
        areaId: z.string().optional(),
        grade: z.string().optional(),
        courseType: z.enum(["fuchu", "fuchu_advance"]).optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db
        .insert(students)
        .values({
          ...values,
          areaId: values.areaId || null,
          grade: values.grade || null,
          courseType: values.courseType || "fuchu",
        })
        .returning();
      return c.json(data);
    },
  )
  .patch(
    "/students/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        birthDate: z.string().optional(),
        school: z.string().optional(),
        parentId: z.string().optional(),
        areaId: z.string().nullable().optional(),
        grade: z.string().nullable().optional(),
        courseType: z.enum(["fuchu", "fuchu_advance"]).optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db.update(students).set(values).where(eq(students.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/students/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(students).where(eq(students.id, id));
    return c.json({ success: true });
  });
