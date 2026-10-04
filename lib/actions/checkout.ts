"use server";

import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/rbac";
import { checkoutSchema } from "@/lib/schemas/checkout";
import { coupons, orders, products } from "@/lib/mongodb";
import { createOrderNumber, findSizeQty, priceCart } from "@/lib/commerce";
import { BkashGateway } from "@/lib/payments/bkash";
import { NagadGateway } from "@/lib/payments/nagad";
import { SslcommerzGateway } from "@/lib/payments/sslcommerz";
import type { CartLine, Order, Product } from "@/types";

export async function checkoutAction(formData: FormData) {
  const session = await requireUser();
  if (session.user.role !== "customer") {
    return { error: "FORBIDDEN", message: "শুধু কাস্টমার অর্ডার করতে পারবেন।" };
  }
  const raw = formData.get("payload");
  let input: unknown;
  try { input = JSON.parse(String(raw)); } catch { return { error: "INVALID_INPUT" }; }
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { error: "INVALID_INPUT" };
  const data = parsed.data;
  const productCollection = await products();
  const productDocs: Product[] = [];
  for (const line of data.lines) {
    const product = await productCollection.findOne({ id: line.productId });
    if (!product || findSizeQty(product, line.color, line.size) < line.qty) return { error: "OUT_OF_STOCK", item: line };
    productDocs.push(product);
  }
  const cartLines: CartLine[] = data.lines.map((line, index) => {
    const product = productDocs[index];
    return { productId: product.id, slug: product.slug, name: product.name, image: product.image, color: line.color, size: line.size, qty: line.qty, addInstallation: Boolean(line.addInstallation) };
  });
  const coupon = data.paymentMethod === "cod" ? null : await (await coupons()).findOne({ code: "FIX10", active: true });
  const totals = priceCart(cartLines, productDocs, coupon);
  const sequence = await (await orders()).countDocuments() + 1;
  const order: Order = {
    id: randomUUID(), orderNumber: createOrderNumber(sequence), userId: session.user.id, email: session.user.email,
    items: cartLines.map((line, index) => ({ type: "product", productId: line.productId, slug: line.slug, name: line.name, image: line.image, color: line.color, size: line.size, qty: line.qty, unitPrice: productDocs[index].price })),
    address: { id: randomUUID(), fullName: data.name, email: data.email, phone: data.phone, line1: data.address.line1, area: data.address.area, city: data.address.city, district: data.address.district, division: data.address.division, postalCode: data.address.postalCode, country: data.address.country },
    subtotal: totals.subtotal, shipping: totals.shipping, discount: totals.discount, total: totals.total, currency: "BDT",
    status: "pending", paymentMethod: data.paymentMethod, paymentStatus: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await (await orders()).insertOne(order);
  if (data.paymentMethod === "cod") {
    await decrementStock(cartLines, productDocs);
    return { success: true, orderId: order.id };
  }
  const gateway = data.paymentMethod === "bkash" ? new BkashGateway() : data.paymentMethod === "nagad" ? new NagadGateway() : new SslcommerzGateway();
  try {
    const sessionResult = await gateway.createSession(order);
    return { redirectUrl: sessionResult.redirectUrl, orderId: order.id };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) return { error: "PAYMENT_UNAVAILABLE", message: "Online payment is not configured. Choose COD." };
    return { error: "PAYMENT_FAILED", message: "We could not start the payment. Please try again." };
  }
}

async function decrementStock(lines: CartLine[], productDocs: Product[]) {
  const collection = await products();
  for (const [index, line] of lines.entries()) {
    const product = productDocs[index];
    const variants = product.variants.map((variant) => variant.color !== line.color ? variant : { ...variant, sizes: variant.sizes.map((size) => size.size !== line.size ? size : { ...size, qty: size.qty - line.qty }) });
    const stockQty = variants.reduce((sum, variant) => sum + variant.sizes.reduce((sizeSum, size) => sizeSum + size.qty, 0), 0);
    await collection.updateOne({ id: product.id }, { $set: { variants, stockQty, inStock: stockQty > 0, updatedAt: new Date().toISOString() } });
  }
}
