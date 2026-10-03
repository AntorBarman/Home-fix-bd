import { z } from "zod";
const phone = z.string().regex(/^01[3-9]\d{8}$/);
export const sellerSettingsSchema = z.object({
  businessName: z.string().trim().min(2), ownerName: z.string().trim().min(2), phone,
  line1: z.string().trim().min(2), area: z.string().trim().min(2), city: z.string().trim().min(2), district: z.string().trim().min(2),
  tradeLicenseUrl: z.string().url().or(z.literal("")).default(""), nidUrl: z.string().url().or(z.literal("")).default(""),
  bankName: z.string().default(""), accountNumber: z.string().default(""), branch: z.string().default(""),
  mfsProvider: z.enum(["", "bkash", "nagad"]).default(""), mfsNumber: z.string().default(""),
});
