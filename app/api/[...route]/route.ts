import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { handle } from "hono/vercel";
import { areasRoutes } from "./routes/areas";
import { coursesRoutes } from "./routes/courses";
import { dashboardRoutes } from "./routes/dashboard";
import { dayNotesRoutes } from "./routes/day-notes";
import { helloRoutes } from "./routes/hello";
import { holidaysRoutes } from "./routes/holidays";
import { installmentsRoutes } from "./routes/installments";
import { lessonSlotsRoutes } from "./routes/lesson-slots";
import { lessonsRoutes } from "./routes/lessons";
import { reflectionsRoutes } from "./routes/reflections";
import { stagesRoutes } from "./routes/stages";
import { studentStageProgressRoutes } from "./routes/student-stage-progress";
import { studentTermSelectionsRoutes } from "./routes/student-term-selections";

import { studentsRoutes } from "./routes/students";
import { termsRoutes } from "./routes/terms";
import { usersRoutes } from "./routes/users";

const app = new OpenAPIHono().basePath("/api");

// Mount all routes
const routes = app
  .route("/", helloRoutes)
  .route("/", dashboardRoutes)
  .route("/", usersRoutes)
  .route("/", studentsRoutes)
  .route("/", areasRoutes)
  .route("/", termsRoutes)
  .route("/", coursesRoutes)
  .route("/", lessonSlotsRoutes)
  .route("/", studentTermSelectionsRoutes)
  .route("/", lessonsRoutes)
  .route("/", reflectionsRoutes)
  .route("/", stagesRoutes)
  .route("/", dayNotesRoutes)
  .route("/", holidaysRoutes)
  .route("/", studentStageProgressRoutes)
  .route("/", installmentsRoutes);

// The OpenAPI documentation will be available at /api/doc
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Hono API",
  },
});

// The Swagger UI will be available at /api/ui
app.get("/ui", swaggerUI({ url: "/api/doc" }));

export type AppType = typeof routes;

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
