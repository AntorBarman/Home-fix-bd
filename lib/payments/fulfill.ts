import "server-only";

import { createProductWarranty } from "@/lib/warranty";
import { orders, products, warranties } from "@/lib/mongodb";
import type { Order } from "@/types";

export async function fulfillPayment(field: "bkashPaymentId" | "nagadPaymentId" | "sslcommerzTxnId", paymentId: string, orderNumber: string) {
  const orderCollection = await orders();
  const existing = await orderCollection.findOne({ [field]: paymentId });
  if (existing) return { noop: true };
  const order = await orderCollection.findOne({ orderNumber });
  if (!order) return { missing: true };
  const productCollection = await products();
  for (const item of order.items) {
    if (!item.productId || !item.color || !item.size) continue;
    const product = await productCollection.findOne({ id: item.productId });
    if (!product) continue;
    const variants = product.variants.map((variant) => variant.color !== item.color ? variant : { ...variant, sizes: variant.sizes.map((size) => size.size !== item.size ? size : { ...size, qty: Math.max(0, size.qty - item.qty) }) });
    const stockQty = variants.reduce((sum, variant) => sum + variant.sizes.reduce((sizeSum, size) => sizeSum + size.qty, 0), 0);
    await productCollection.updateOne({ id: product.id }, { $set: { variants, stockQty, inStock: stockQty > 0, updatedAt: new Date().toISOString() } });
  }
  const result = await orderCollection.updateOne({ _id: order._id, [field]: { $exists: false } }, { $set: { status: "paid", paymentStatus: "paid", [field]: paymentId, updatedAt: new Date().toISOString() } });
  if (result.modifiedCount === 0) return { noop: true };
  const warrantyCollection = await warranties();
  for (const [index] of order.items.entries()) await warrantyCollection.updateOne({ id: `warranty-${order.orderNumber}-${index}` }, { $set: createProductWarranty(order as Order, index) }, { upsert: true });
  return { received: true };
}
