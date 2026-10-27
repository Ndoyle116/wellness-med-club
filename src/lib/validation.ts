import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email")
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Too long");

export const signupSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Required").max(128),
});
