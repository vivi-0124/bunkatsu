import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recurringItems } from "@/db/schemas/recurring-item";

export const recurringItemsRoutes = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/recurring-items",
      request: {
        query: z.object({
          userId: z.string(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                items: z.array(
                  z.object({
                    id: z.string(),
                    userId: z.string(),
                    name: z.string(),
                    amount: z.union([z.number(), z.string()]),
                    type: z.enum(["payment", "income"]),
                    startMonth: z.string().nullable().optional(),
                    paymentDate: z.string().nullable().optional(),
                    isActive: z.boolean(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                  }),
                ),
              }),
            },
          },
          description: "Recurring items list",
        },
      },
    }),
    async (c) => {
      const { userId } = c.req.valid("query");
      const items = await db
        .select()
        .from(recurringItems)
        .where(eq(recurringItems.userId, userId));
      return c.json({
        items: items.map((item) => ({ ...item, isActive: !!item.isActive })),
      });
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/recurring-items",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                userId: z.string(),
                name: z.string(),
                amount: z.number(),
                type: z.enum(["payment", "income"]),
                startMonth: z.string().nullable().optional(),
                paymentDate: z.string().nullable().optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
                id: z.string(),
              }),
            },
          },
          description: "Recurring item created",
        },
      },
    }),
    async (c) => {
      const values = c.req.valid("json");
      const id = crypto.randomUUID();
      await db.insert(recurringItems).values({ ...values, id });
      return c.json({ success: true, id });
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/recurring-items/{id}",
      request: {
        params: z.object({
          id: z.string(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ success: z.boolean() }),
            },
          },
          description: "Recurring item deleted",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      await db.delete(recurringItems).where(eq(recurringItems.id, id));
      return c.json({ success: true });
    },
  )
  .openapi(
    createRoute({
      method: "patch",
      path: "/recurring-items/{id}",
      request: {
        params: z.object({
          id: z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: z.object({
                name: z.string().optional(),
                amount: z.number().optional(),
                startMonth: z.string().nullable().optional(),
                paymentDate: z.string().nullable().optional(),
                isActive: z.boolean().optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ success: z.boolean() }),
            },
          },
          description: "Recurring item updated",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      await db
        .update(recurringItems)
        .set({ ...body, updatedAt: new Date().toISOString() })
        .where(eq(recurringItems.id, id));
      return c.json({ success: true });
    },
  );
