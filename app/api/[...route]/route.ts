import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { handle } from "hono/vercel";
import { fixedCostsRoutes } from "./routes/fixed-costs";
import { monthlyRecordsRoutes } from "./routes/monthly-records";
import { recurringItemsRoutes } from "./routes/recurring-items";
import { usersRoutes } from "./routes/users";

const app = new OpenAPIHono().basePath("/api");

// Mount all routes
const routes = app
  .route("/", usersRoutes)
  .route("/", fixedCostsRoutes)
  .route("/", monthlyRecordsRoutes)
  .route("/", recurringItemsRoutes);

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
