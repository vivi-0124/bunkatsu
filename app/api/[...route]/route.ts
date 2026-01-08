import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schemas/auth-schema";
import {
  areas,
  courses,
  dayNotes,
  holidays,
  lessonSlots,
  lessons,
  reflections,
  stages,
  studentStageProgress,
  students,
  studentTermSelections,
  terms,
} from "@/db/schemas/book";
import { dashboardTasks } from "@/db/schemas/dashboard-schema";
import { installments } from "@/db/schemas/installment";

const app = new Hono().basePath("/api");

const routes = app
  .get("/hello", (c) => {
    return c.json({
      message: "Hello from Hono!",
    });
  })
  .get("/dashboard-tasks", async (c) => {
    const data = await db.select().from(dashboardTasks);
    return c.json(data);
  })
  .get("/users", async (c) => {
    const data = await db.select().from(users);
    return c.json(data);
  })
  .patch(
    "/users/:id/role",
    zValidator(
      "json",
      z.object({
        role: z.enum(["admin", "tutor", "student"]),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const { role } = c.req.valid("json");
      await db.update(users).set({ role }).where(eq(users.id, id));
      return c.json({ success: true });
    },
  )
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
  })
  .get("/areas", async (c) => {
    const data = await db.select().from(areas);
    return c.json(data);
  })
  .post(
    "/areas",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(areas).values(values).returning();
      return c.json(data);
    },
  )
  .patch(
    "/areas/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db.update(areas).set(values).where(eq(areas.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/areas/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(areas).where(eq(areas.id, id));
    return c.json({ success: true });
  })
  .get("/terms", async (c) => {
    const data = await db.select().from(terms);
    return c.json(data);
  })
  .post(
    "/terms",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        presentationDate: z.string(),
        totalLessons: z.number(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(terms).values(values).returning();
      return c.json(data);
    },
  )
  .patch(
    "/terms/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        presentationDate: z.string().optional(),
        totalLessons: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db.update(terms).set(values).where(eq(terms.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/terms/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(terms).where(eq(terms.id, id));
    return c.json({ success: true });
  })
  .get("/courses", async (c) => {
    const data = await db.select().from(courses);
    return c.json(data);
  })
  .post(
    "/courses",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        displayName: z.string(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        termDuration: z.number().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(courses).values(values).returning();
      return c.json(data);
    },
  )
  .patch(
    "/courses/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        displayName: z.string().optional(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        termDuration: z.number().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db.update(courses).set(values).where(eq(courses.id, id));
      return c.json({ success: true });
    },
  )
  .delete("/courses/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(courses).where(eq(courses.id, id));
    return c.json({ success: true });
  })
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
  })
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
  })
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
  })
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
  )
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
  )
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
  )
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
  )
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
  )
  // Installments CRUD
  .get(
    "/installments",
    zValidator(
      "query",
      z.object({
        userId: z.string(),
      }),
    ),
    async (c) => {
      const { userId } = c.req.valid("query");
      const data = await db
        .select()
        .from(installments)
        .where(eq(installments.userId, userId));
      return c.json(data);
    },
  )
  .post(
    "/installments",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        name: z.string(),
        totalPayments: z.number(),
        startDate: z.string(), // YYYY-MM形式
        amountPerPayment: z.number(),
        totalAmount: z.number(),
      }),
    ),
    async (c) => {
      const values = c.req.valid("json");
      const [data] = await db.insert(installments).values(values).returning();
      return c.json(data);
    },
  )
  .patch(
    "/installments/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        totalPayments: z.number().optional(),
        startDate: z.string().optional(),
        amountPerPayment: z.number().optional(),
        totalAmount: z.number().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.param();
      const values = c.req.valid("json");
      await db
        .update(installments)
        .set({ ...values, updatedAt: new Date().toISOString() })
        .where(eq(installments.id, Number(id)));
      return c.json({ success: true });
    },
  )
  .delete("/installments/:id", async (c) => {
    const { id } = c.req.param();
    await db.delete(installments).where(eq(installments.id, Number(id)));
    return c.json({ success: true });
  })
  // Installments CSV Export
  .get(
    "/installments/export",
    zValidator(
      "query",
      z.object({
        userId: z.string(),
      }),
    ),
    async (c) => {
      const { userId } = c.req.valid("query");
      const data = await db
        .select()
        .from(installments)
        .where(eq(installments.userId, userId));

      const headers = [
        "name",
        "totalPayments",
        "startDate",
        "amountPerPayment",
        "totalAmount",
      ];
      const csvRows = [headers.join(",")];

      for (const row of data) {
        csvRows.push(
          [
            `"${row.name.replace(/"/g, '""')}"`,
            row.totalPayments,
            row.startDate,
            row.amountPerPayment,
            row.totalAmount,
          ].join(","),
        );
      }

      const csvContent = csvRows.join("\n");
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="installments_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    },
  )
  // Installments CSV Template
  .get("/installments/template", async () => {
    const headers = [
      "name",
      "totalPayments",
      "startDate",
      "amountPerPayment",
      "totalAmount",
    ];
    const csvContent = `${headers.join(",")}\n`;
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="installments_template.csv"',
      },
    });
  })
  // Installments CSV Import
  .post(
    "/installments/import",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        csvData: z.string(),
      }),
    ),
    async (c) => {
      const { userId, csvData } = c.req.valid("json");
      const lines = csvData.trim().split("\n");

      if (lines.length < 2) {
        return c.json({ success: false, error: "No data rows found" }, 400);
      }

      const headerLine = lines[0];
      const expectedHeaders = [
        "name",
        "totalPayments",
        "startDate",
        "amountPerPayment",
        "totalAmount",
      ];
      const headers = headerLine
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));

      // Validate headers
      const headerMatch = expectedHeaders.every((h, i) => headers[i] === h);
      if (!headerMatch) {
        return c.json({ success: false, error: "Invalid CSV headers" }, 400);
      }

      const insertedRows = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line (handle quoted values)
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        if (values.length !== 5) {
          errors.push(`Row ${i + 1}: Invalid number of columns`);
          continue;
        }

        const [
          name,
          totalPaymentsStr,
          startDate,
          amountPerPaymentStr,
          totalAmountStr,
        ] = values;
        const totalPayments = Number.parseInt(totalPaymentsStr, 10);
        const amountPerPayment = Number.parseInt(amountPerPaymentStr, 10);
        const totalAmount = Number.parseInt(totalAmountStr, 10);

        if (
          !name ||
          Number.isNaN(totalPayments) ||
          !startDate ||
          Number.isNaN(amountPerPayment) ||
          Number.isNaN(totalAmount)
        ) {
          errors.push(`Row ${i + 1}: Invalid data format`);
          continue;
        }

        try {
          const [inserted] = await db
            .insert(installments)
            .values({
              userId,
              name,
              totalPayments,
              startDate,
              amountPerPayment,
              totalAmount,
            })
            .returning();
          insertedRows.push(inserted);
        } catch (_err) {
          errors.push(`Row ${i + 1}: Database error`);
        }
      }

      return c.json({
        success: true,
        inserted: insertedRows.length,
        errors,
      });
    },
  );

export type AppType = typeof routes;

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
