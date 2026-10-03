"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/rbac";
import { orders, warranties } from "@/lib/mongodb";
import { warrantyClaimSchema } from "@/lib/schemas/warranty";
export async function fileClaimAction(formData: FormData) {
  const session = await requireUser();
  const parsed = warrantyClaimSchema.safeParse({ warrantyId: formData.get("warrantyId"), reason: formData.get("reason"), description: formData.get("description"), photos: String(formData.get("photos") || "").split("\n").filter(Boolean) });
  if (!parsed.success) return { error: "Please check your claim.", fieldErrors: parsed.error.flatten().fieldErrors };
  const warranty = await (await warranties()).findOne({ id: parsed.data.warrantyId });
  if (!warranty || new Date(warranty.endDate) <= new Date()) return { error: "This warranty is unavailable or expired." };
  const order = await (await orders()).findOne({ id: warranty.orderId, userId: session.user.id });
  if (!order) return { error: "Warranty does not belong to this account." };
  const claim = { id: crypto.randomUUID(), reason: parsed.data.reason, description: parsed.data.description, photos: parsed.data.photos, status: "open" as const, createdAt: new Date().toISOString() };
  await (await warranties()).updateOne({ id: warranty.id }, { $push: { claims: claim } });
  revalidatePath("/account/warranty"); return { success: true };
}
export async function updateClaimStatusAction(warrantyId: string, claimId: string, status: "open" | "in_progress" | "approved" | "rejected" | "resolved", note = "") { await requireAdmin(); await (await warranties()).updateOne({ id: warrantyId, "claims.id": claimId }, { $set: { "claims.$.status": status, "claims.$.note": note, ...(status === "resolved" ? { "claims.$.resolvedAt": new Date().toISOString() } : {}) } }); revalidatePath("/admin/warranties"); revalidatePath(`/account/warranty/${warrantyId}`); return { success: true }; }
