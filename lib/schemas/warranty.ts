import { z } from "zod";
export const warrantyClaimSchema = z.object({ warrantyId: z.string().min(1), reason: z.enum(["defective", "not_working", "poor_quality", "wrong_item", "other"]), description: z.string().trim().min(20).max(2000), photos: z.array(z.string().url()).max(5).optional().default([]) });
