import { z } from "zod";
export const reviewSchema = z.object({ productId: z.string().min(1), rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().min(3).max(120), body: z.string().trim().min(10).max(2000), photos: z.array(z.string().url()).max(3).optional().default([]) });
