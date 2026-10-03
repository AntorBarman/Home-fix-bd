import { z } from "zod";

const nid = z.string().regex(/^(\d{10}|\d{13}|\d{17})$/, "NID must be 10, 13, or 17 digits");
const skill = z.object({ serviceSlug: z.string().min(1), level: z.enum(["junior", "mid", "senior"]), yearsExperience: z.coerce.number().int().min(0).max(60) });
const slot = z.object({ day: z.string().min(2), slots: z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/)).max(10) });
export const technicianProfileSchema = z.object({
  photo: z.string().url().or(z.literal("")).default(""),
  nameBn: z.string().trim().min(2),
  skills: z.array(skill).max(20),
  serviceAreas: z.array(z.string().min(2)).max(20),
  visitCharge: z.coerce.number().int().min(0).max(100000),
  experienceYears: z.coerce.number().int().min(0).max(60),
  availability: z.array(slot).max(7),
  nidNumber: nid.optional().or(z.literal("")),
  nidImageUrl: z.string().url().or(z.literal("")).default(""),
});
