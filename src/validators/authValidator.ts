import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const registerSchema: z.ZodType<RegisterBody> = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[A-Za-z]/, { message: "Password must contain a letter" })
    .regex(/[0-9]/, { message: "Password must contain a number" }),
});

export const registerValidator = zValidator("json", registerSchema);
