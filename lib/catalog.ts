import "server-only";

import catalogJson from "@/data/catalog.json";
import servicesJson from "@/data/services.json";
import type { Category, Product, Service } from "@/types";

export const categories: Category[] = [
  { id: "electrical", name: "Electrical", nameBn: "ইলেকট্রিক্যাল", slug: "electrical", description: "নিরাপদ তার, আলো ও সুইচ", icon: "⚡" },
  { id: "plumbing", name: "Plumbing", nameBn: "প্লাম্বিং", slug: "plumbing", description: "কল, পাইপ ও পানির কাজ", icon: "◒" },
  { id: "sanitary", name: "Sanitary", nameBn: "স্যানিটারি", slug: "sanitary", description: "বাথরুম ফিটিংস", icon: "◌" },
  { id: "ac", name: "AC", nameBn: "এসি", slug: "ac", description: "ঠান্ডা ঘরের সমাধান", icon: "❄" },
  { id: "refrigerator", name: "Refrigerator", nameBn: "রেফ্রিজারেটর", slug: "refrigerator", description: "খাবার রাখুন সতেজ", icon: "▣" },
  { id: "tv", name: "TV", nameBn: "টিভি", slug: "tv", description: "ঘরের বিনোদন", icon: "▤" },
  { id: "carpentry", name: "Carpentry", nameBn: "কাঠের কাজ", slug: "carpentry", description: "মজবুত কাঠের কাজ", icon: "⌁" },
  { id: "painting", name: "Painting", nameBn: "রং করা", slug: "painting", description: "দেয়ালে নতুন রং", icon: "◈" },
];

const jsonProducts = catalogJson as Product[];
const jsonServices = servicesJson as Service[];
export type CatalogData = { products: Product[]; categories: Category[]; services: Service[] };

// ─── Serialize helper — MUST be exported for use elsewhere ───
export function serializeProduct(doc: any): Product {
  if (!doc) return doc;
  return {
    ...doc,
    _id: doc._id?.toString?.() ?? undefined,
  } as Product;
}

export async function loadCatalog(): Promise<CatalogData> {
  try {
    const { products: productCollection, services: serviceCollection, categories: categoryCollection } = await import("@/lib/mongodb");
    const [productDocs, categoryDocs, serviceDocs] = await Promise.all([
      (await productCollection()).find({ published: { $ne: false } }).toArray(),
      (await categoryCollection()).find({}).toArray(),
      (await serviceCollection()).find({}).toArray(),
    ]);
    if (productDocs.length || categoryDocs.length || serviceDocs.length) {
      return {
        products: productDocs.map(serializeProduct),
        categories: categoryDocs.length ? categoryDocs : categories,
        services: serviceDocs.length ? serviceDocs : jsonServices,
      };
    }
  } catch (error) {
    console.warn("[catalog] Mongo unavailable, using JSON fallback", error instanceof Error ? error.message : error);
  }
  return { products: jsonProducts, categories, services: jsonServices };
}

// ─── Legacy sync (JSON only) ───
export const products = jsonProducts;
export const serviceCatalog = jsonServices;
export function getProduct(slug: string) { return products.find((p) => p.slug === slug); }
export function getService(slug: string) { return serviceCatalog.find((s) => s.slug === slug); }

// ─── NEW: MongoDB-first async functions ───
export async function getAllProducts(): Promise<Product[]> {
  try {
    const { products: productCollection } = await import("@/lib/mongodb");
    const col = await productCollection();
    const docs = await col.find({ published: { $ne: false } }).toArray();
    if (docs.length) return docs.map(serializeProduct);
  } catch (error) {
    console.warn("[catalog] getAllProducts Mongo failed, using JSON fallback", error instanceof Error ? error.message : error);
  }
  return jsonProducts;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { products: productCollection } = await import("@/lib/mongodb");
    const col = await productCollection();
    const result = await col.findOne({ slug, published: { $ne: false } });
    if (result) return serializeProduct(result);
  } catch (error) {
    console.warn("[catalog] getProductBySlug Mongo failed, using JSON fallback", error instanceof Error ? error.message : error);
  }
  return jsonProducts.find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  try {
    const { products: productCollection } = await import("@/lib/mongodb");
    const col = await productCollection();
    const docs = await col.find({ category: categorySlug, published: { $ne: false } }).toArray();
    if (docs.length) return docs.map(serializeProduct);
  } catch (error) {
    console.warn("[catalog] getProductsByCategory Mongo failed, using JSON fallback", error instanceof Error ? error.message : error);
  }
  return jsonProducts.filter((p) => p.category === categorySlug);
}