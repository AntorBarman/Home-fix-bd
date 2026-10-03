"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/rbac";
import { sellers } from "@/lib/mongodb";
import { sellerSettingsSchema } from "@/lib/schemas/seller";

export async function updateSettingsAction(formData: FormData) {
  const session = await requireSeller();
  const parsed = sellerSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check your seller details." };
  const data = parsed.data;
  await (await sellers()).updateOne({ userId: session.user.id }, { $set: { businessName: data.businessName, ownerName: data.ownerName, phone: data.phone, address: { line1: data.line1, area: data.area, city: data.city, district: data.district }, tradeLicenseUrl: data.tradeLicenseUrl, nidUrl: data.nidUrl, bankAccount: { bankName: data.bankName, accountNumber: data.accountNumber, branch: data.branch }, ...(data.mfsProvider ? { mfs: { provider: data.mfsProvider, number: data.mfsNumber } } : {}), ...(data.tradeLicenseUrl ? { verificationStatus: "under_review" } : {}), updatedAt: new Date().toISOString() } });
  revalidatePath("/seller/settings");
  return { success: true };
}
