import { z } from "zod";
export const ticketSchema = z.object({ category: z.enum(["electrical", "plumbing", "order", "delivery", "technician", "other"]), subject: z.string().trim().min(5).max(120), description: z.string().trim().min(20).max(2000), relatedOrderId: z.string().optional(), relatedBookingNumber: z.string().optional() });
export const replySchema = z.object({ ticketId: z.string().min(1), message: z.string().trim().min(2).max(2000) });
