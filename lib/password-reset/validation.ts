import { z } from "zod";
import { SignUpSchema } from "@/lib/validations";
export const resetRequestSchema = z.object({ email: z.string().trim().email().max(254).transform(value => value.toLowerCase()) }).strict();
export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "This reset link is invalid. Request a new one."),
  password: SignUpSchema.shape.password.min(8, "Use at least 8 characters.").max(72, "Use at most 72 characters."),
  confirmPassword: z.string(),
}).strict().refine(value => value.password === value.confirmPassword, { message: "The passwords do not match.", path: ["confirmPassword"] });
