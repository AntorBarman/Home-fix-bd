import { z } from "zod";
export const contactSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email(), subject: z.string().trim().min(3).max(120), message: z.string().trim().min(10).max(2000) });
export const newsletterSchema = z.object({ email: z.string().email() });
