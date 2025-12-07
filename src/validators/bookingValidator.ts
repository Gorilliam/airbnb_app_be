import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const bookingCreateSchema = z.object({
  property_id: z.string({ message: "Property ID is required" }),
  user_id: z.string().optional(), 
  check_in_date: z.string({ message: "Check-in date is required" }),
  check_out_date: z.string({ message: "Check-out date is required" }),
  total_price: z.number().optional(),
  created_at: z.string().optional(),
}).refine(
  (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
  { message: "Check-out date must be after check-in date", path: ["check_out_date"] }
);

export const bookingCreateValidator = zValidator(
  "json",
  bookingCreateSchema,
  (result, c) => {
    if (!result.success) {
      return c.json({ errors: result.error.issues }, 400);
    }
  }
);

const bookingUpdateSchema = z.object({
  check_in_date: z.string().optional(),
  check_out_date: z.string().optional(),
}).refine(
  (data) => {
    if (!data.check_in_date || !data.check_out_date) return true;
    return new Date(data.check_out_date) > new Date(data.check_in_date);
  },
  { message: "Check-out date must be after check-in date", path: ["check_out_date"] }
);

export const bookingUpdateValidator = zValidator(
  "json",
  bookingUpdateSchema,
  (result, c) => {
    if (!result.success) {
      return c.json({ errors: result.error.issues }, 400);
    }
  }
);

const bookingQuerySchema = z.object({
  q: z.string().optional(),
  sort_by: z
    .union([z.literal("check_in_date"), z.literal("check_out_date"), z.literal("created_at")])
    .optional()
    .default("created_at"),
  offset: z.coerce.number().optional().default(0),
  limit: z.coerce.number().optional().default(10),
});

export const bookingQueryValidator = zValidator("query", bookingQuerySchema);

