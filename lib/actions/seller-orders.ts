"use server";
import { revalidatePath } from "next/cache";
import { orders, products, sellers } from "@/lib/mongodb";
import { requireSeller } from "@/lib/rbac";

export async function markSellerItemsReadyAction(orderId: string) {
  const session = await requireSeller();
  const seller = await (await sellers()).findOne({ userId: session.user.id });
  if (!seller?._id) throw new Error("Seller profile not found");
  const ids = new Set((await (await products()).find({ sellerId: seller._id.toString() }).project({ id: 1 }).toArray()).map((p) => p.id));
  const collection = await orders();
  const order = await collection.findOne({ id: orderId, "items.productId": { $in: [...ids] } });
  if (!order) return { error: "Order not found." };
  const items = order.items.map((item) => item.productId && ids.has(item.productId) ? { ...item, readyToShip: true } : item);
  await collection.updateOne({ id: orderId }, { $set: { items, updatedAt: new Date().toISOString() } });
  revalidatePath(`/seller/orders/${orderId}`); return { success: true };
}
