"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { technicians } from "@/lib/mongodb";
import { z } from "zod";

const id = z.object({ id: z.string().min(1) });
const reject = id.extend({ reason: z.string().trim().min(2).max(500) });
export async function approveTechnicianAction(formData: FormData) {
  await requireAdmin();
  const parsed = id.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Invalid technician." };
  await (await technicians()).updateOne({ id: parsed.data.id }, { $set: { verified: true, verificationStatus: "verified", updatedAt: new Date().toISOString() } });
  revalidatePath("/admin/technicians"); return { success: true };
}
export async function rejectTechnicianAction(formData: FormData) {
  await requireAdmin();
  const parsed = reject.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "A rejection reason is required." };
  await (await technicians()).updateOne({ id: parsed.data.id }, { $set: { verified: false, verificationStatus: "rejected", rejectionReason: parsed.data.reason, updatedAt: new Date().toISOString() } });
  revalidatePath("/admin/technicians"); return { success: true };
}
