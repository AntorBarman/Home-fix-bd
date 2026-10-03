import { z } from "zod";

const bangladeshPhone = /^01[3-9]\d{8}$/;

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  phone: z.string().regex(bangladeshPhone, "Enter a valid Bangladesh phone number"),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
