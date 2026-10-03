import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladesh phone number"),
  address: z.object({
    line1: z.string().trim().min(3),
    area: z.string().trim().min(2),
    city: z.string().trim().min(2),
    district: z.string().trim().min(2),
    division: z.string().trim().min(2),
    postalCode: z.string().trim().min(3),
    country: z.string().default("BD"),
  }),
  notes: z.string().optional(),
  paymentMethod: z.enum(["bkash", "nagad", "sslcommerz", "cod"]),
  lines: z.array(z.object({ productId: z.string(), color: z.string(), size: z.string(), qty: z.number().int().positive(), addInstallation: z.boolean().optional() })).min(1),
});
