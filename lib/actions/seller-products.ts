"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/rbac";
import { products, sellers } from "@/lib/mongodb";
import { sellerProductSchema } from "@/lib/schemas/seller-products";
import { randomUUID } from "node:crypto";

async function sellerContext() {
  const session = await requireSeller();
  const seller = await (await sellers()).findOne({ userId: session.user.id });
  if (!seller?._id) throw new Error("Seller profile not found");
  return { session, sellerId: seller._id.toString() };
}

function parse(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const list = (key: string) => String(raw[key] ?? "").split("\n").map((v) => v.trim()).filter(Boolean);
  return sellerProductSchema.safeParse({
    ...raw, published: raw.published === "on", installable: raw.installable === "on",
    variants: raw.variants ? JSON.parse(String(raw.variants)) : [],
    materials: list("materials"), features: list("features"),
    specifications: raw.specifications ? JSON.parse(String(raw.specifications)) : {},
  });
}

export async function createSellerProductAction(formData: FormData) {
  const { sellerId } = await sellerContext();
  const parsed = parse(formData);
  if (!parsed.success) return { error: "Please check the product fields." };
  const data = parsed.data;
  const normalized = { ...data, badge: data.badge || undefined };
  const stockQty = data.variants.flatMap((v) => v.sizes).reduce((sum, s) => sum + s.qty, 0);
  await (await products()).insertOne({ ...normalized, id: randomUUID(), sellerId, stockQty, inStock: stockQty > 0, rating: 0, reviewCount: 0, featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  revalidatePath("/seller/products"); revalidatePath("/shop"); return { success: true };
}

export async function updateSellerProductAction(formData: FormData) {
  const { sellerId } = await sellerContext();
  const parsed = parse(formData);
  if (!parsed.success || !parsed.data.id) return { error: "Invalid product." };
  const { id, ...data } = parsed.data;
  const normalized = { ...data, badge: data.badge || undefined };
  const existing = await (await products()).findOne({ id, sellerId });
  if (!existing) return { error: "Product not found." };
  const stockQty = data.variants.flatMap((v) => v.sizes).reduce((sum, s) => sum + s.qty, 0);
  await (await products()).updateOne({ id, sellerId }, { $set: { ...normalized, stockQty, inStock: stockQty > 0, updatedAt: new Date().toISOString() } });
  revalidatePath("/seller/products"); revalidatePath(`/seller/products/${id}`); return { success: true };
}

export async function deleteSellerProductAction(id: string) {
  const { sellerId } = await sellerContext();
  await (await products()).deleteOne({ id, sellerId });
  revalidatePath("/seller/products"); return { success: true };
}

export async function toggleSellerProductPublishAction(id: string, published: boolean) {
  const { sellerId } = await sellerContext();
  await (await products()).updateOne({ id, sellerId }, { $set: { published, updatedAt: new Date().toISOString() } });
  revalidatePath("/seller/products"); return { success: true };
}
