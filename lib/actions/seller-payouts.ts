"use server";
import { revalidatePath } from "next/cache";
import { orders, products, sellers, sellerPayouts } from "@/lib/mongodb";
import { requireSeller } from "@/lib/rbac";
import { randomUUID } from "node:crypto";

async function context() { const session = await requireSeller(); const seller = await (await sellers()).findOne({ userId: session.user.id }); if (!seller?._id) throw new Error("Seller profile not found"); const owned = await (await products()).find({ sellerId: seller._id.toString() }).project({ id: 1 }).toArray(); return { sellerId: seller._id.toString(), ids: new Set(owned.map((p) => p.id)) }; }
export async function requestSellerPayoutAction() {
  const { sellerId, ids } = await context();
  const recent = await (await orders()).find({ paymentStatus: "paid", "items.productId": { $in: [...ids] } }).toArray();
  const gross = recent.reduce((sum, o) => sum + o.items.filter((i) => i.productId && ids.has(i.productId)).reduce((s, i) => s + i.unitPrice * i.qty, 0), 0);
  if (gross < 1000) return { error: "Minimum payout is ৳1,000." };
  const commission = Math.round(gross * 0.15);
  await (await sellerPayouts()).insertOne({ id: randomUUID(), sellerId, periodFrom: new Date(Date.now() - 30 * 86400000).toISOString(), periodTo: new Date().toISOString(), grossRevenue: gross, commission, netPayout: gross - commission, destination: "Seller account", status: "pending", createdAt: new Date().toISOString() });
  revalidatePath("/seller/payouts"); return { success: true };
}
