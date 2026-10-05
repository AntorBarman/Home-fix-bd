"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/rbac";
import { products, sellers } from "@/lib/mongodb";
import { sellerProductSchema } from "@/lib/schemas/seller-products";
import { randomUUID } from "node:crypto";
import type { Collection } from "mongodb";

async function sellerContext() {
  const session = await requireSeller();
  const seller = await (await sellers()).findOne({ userId: session.user.id });
  if (!seller?._id) throw new Error("Seller profile not found");
  return { session, sellerId: seller._id.toString() };
}

// ─── Helpers ──────────────────────────────────────────────

function generateSKU(name: string, category: string): string {
  const catCode = category.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "GEN";
  const nameCode = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4) || "PRD";
  const random = Math.floor(100 + Math.random() * 900);
  return `HF-${catCode}-${nameCode}-${random}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function generateUniqueSlug(
  collection: Collection<any>,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug || "product";
  let counter = 1;
  while (true) {
    const query: any = { slug };
    if (excludeId) query.id = { $ne: excludeId };
    const existing = await collection.findOne(query);
    if (!existing) return slug;
    slug = `${baseSlug}-${++counter}`;
    if (counter > 100) return `${baseSlug}-${Date.now()}`;
  }
}

function parse(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const list = (key: string) =>
    String(raw[key] ?? "")
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  return sellerProductSchema.safeParse({
    ...raw,
    published: raw.published === "on",
    installable: raw.installable === "on",
    variants: raw.variants ? JSON.parse(String(raw.variants)) : [],
    materials: list("materials"),
    features: list("features"),
    specifications: raw.specifications
      ? JSON.parse(String(raw.specifications))
      : {},
  });
}

function computeStock(variants: Array<{ sizes: Array<{ qty: number }> }>) {
  return variants
    .flatMap((v) => v.sizes || [])
    .reduce((sum, s) => sum + (s.qty || 0), 0);
}

// ─── Actions ──────────────────────────────────────────────

export async function createSellerProductAction(formData: FormData) {
  const { sellerId } = await sellerContext();

  const parsed = parse(formData);
  if (!parsed.success) {
    throw new Error(
      "Please check the product fields: " +
        JSON.stringify(parsed.error.flatten().fieldErrors)
    );
  }
  const data = parsed.data;
  const normalized = { ...data, badge: data.badge || undefined };

  const col = await products();

  let sku = (data.sku as string || "").trim();
  if (!sku) {
    sku = generateSKU(data.name, data.category || "general");
  }

  let slug = (data.slug as string || "").trim();
  if (!slug) {
    slug = await generateUniqueSlug(col, slugify(data.name));
  } else {
    slug = await generateUniqueSlug(col, slugify(slug));
  }

  const stockQty = computeStock(data.variants as any);

  await col.insertOne({
    ...normalized,
    sku,
    slug,
    id: randomUUID(),
    sellerId,
    stockQty,
    inStock: stockQty > 0,
    rating: 0,
    reviewCount: 0,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  revalidatePath("/seller/products");
  revalidatePath("/shop");

  redirect("/seller/products?created=1");
}

export async function updateSellerProductAction(formData: FormData) {
  const { sellerId } = await sellerContext();

  const parsed = parse(formData);
  if (!parsed.success || !parsed.data.id) {
    throw new Error("Invalid product data.");
  }
  const { id, ...data } = parsed.data;
  const normalized = { ...data, badge: data.badge || undefined };

  const col = await products();
  const existing = await col.findOne({ id, sellerId });
  if (!existing) {
    throw new Error("Product not found.");
  }

  let sku = (data.sku as string || "").trim() || (existing.sku as string);
  if (!sku) sku = generateSKU(data.name, data.category || "general");

  let slug = (data.slug as string || "").trim();
  if (!slug) {
    slug = existing.slug as string;
  } else {
    slug = await generateUniqueSlug(col, slugify(slug), id);
  }

  const stockQty = computeStock(data.variants as any);

  await col.updateOne(
    { id, sellerId },
    {
      $set: {
        ...normalized,
        sku,
        slug,
        stockQty,
        inStock: stockQty > 0,
        updatedAt: new Date().toISOString(),
      },
    }
  );

  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${id}`);
  revalidatePath("/shop");

  redirect("/seller/products?updated=1");
}

export async function deleteSellerProductAction(id: string) {
  const { sellerId } = await sellerContext();
  await (await products()).deleteOne({ id, sellerId });
  revalidatePath("/seller/products");
  return { success: true };
}

export async function toggleSellerProductPublishAction(
  id: string,
  published: boolean
) {
  const { sellerId } = await sellerContext();
  await (await products()).updateOne(
    { id, sellerId },
    { $set: { published, updatedAt: new Date().toISOString() } }
  );
  revalidatePath("/seller/products");
  revalidatePath("/shop");
  return { success: true };
}