import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const propertySchema: z.ZodType<NewProperty> = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(), // will be filled in by backend via user.id
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  price_per_night: z.number().positive("Price per night must be positive"),
  availability: z.boolean().optional(),
  created_at: z.string().optional(),
});

// JSON body validator
export const propertyValidator = zValidator("json", propertySchema, (result, c) => {
  if (!result.success) {
    return c.json({ errors: result.error.issues }, 400);
  }
});

// Query validator (like courseQueryValidator)
const propertyQuerySchema: z.ZodType<PropertyListQuery> = z.object({
  limit: z.coerce.number().optional().default(10),
  offset: z.coerce.number().optional().default(0),
  q: z.string().optional(),
  location: z.string().optional(),
  sort_by: z
    .union([
      z.literal("name"),
      z.literal("price_per_night"),
      z.literal("created_at"),
      z.string(),
    ])
    .optional()
    .default("name"),
});

export const propertyQueryValidator = zValidator("query", propertyQuerySchema);
