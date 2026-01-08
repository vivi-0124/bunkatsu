import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db";
import {
  courses,
  students,
  studentTermSelections,
  terms,
} from "@/db/schemas/book";

export const studentTermSelectionsRoutes = new Hono()
  .get("/student-term-selections", async (c) => {
    const data = await db
      .select({
        id: studentTermSelections.id,
        studentId: studentTermSelections.studentId,
        studentName: students.name,
        termId: studentTermSelections.termId,
        termName: terms.name,
        courseId: studentTermSelections.courseId,
        courseName: courses.displayName,
        courseType: studentTermSelections.courseType,
        status: studentTermSelections.status,
      })
      .from(studentTermSelections)
      .leftJoin(students, eq(studentTermSelections.studentId, students.id))
      .leftJoin(terms, eq(studentTermSelections.termId, terms.id))
      .leftJoin(courses, eq(studentTermSelections.courseId, courses.id));
    return c.json(data);
  })
  .post(
    "/student-term-selections",
    zValidator(
      "json",
      z.object({
        studentId: z.string(),
        termId: z.string(),
        courseId: z.string(),
        courseType: z.enum(["fuchu", "fuchu_advance"]),
        status: z.enum(["active", "completed", "canceled"]).optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db
        .insert(studentTermSelections)
        .values(values)
        .returning();
      return c.json(data);
    },
  )
  .patch(
    "/student-term-selections/:id",
    zValidator(
      "json",
      z.object({
        studentId: z.string().optional(),
        termId: z.string().optional(),
        courseId: z.string().optional(),
        courseType: z.enum(["fuchu", "fuchu_advance"]).optional(),
        status: z.enum(["active", "completed", "canceled"]).optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db
        .update(studentTermSelections)
        .set(values)
        .where(eq(studentTermSelections.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/student-term-selections/:id", async (c) => {
    const { id } = c.req.param();
    await db
      .delete(studentTermSelections)
      .where(eq(studentTermSelections.id, id));
    return c.json({ success: true });
  });
