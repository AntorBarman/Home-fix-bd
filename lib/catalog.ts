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
  { id: "painting", name: "Painting", nameBn: "রং করা", slug: "painting", description: "দেয়ালে নতুন রং", icon: "◈" },
];

const jsonProducts = catalogJson as Product[];
const jsonServices = servicesJson as Service[];
export type CatalogData = { products: Product[]; categories: Category[]; services: Service[] };

export async function loadCatalog(): Promise<CatalogData> {
  try {
    const { products: productCollection, services: serviceCollection, categories: categoryCollection } = await import("@/lib/mongodb");
    const [productDocs, categoryDocs, serviceDocs] = await Promise.all([
      (await productCollection()).find({ published: { $ne: false } }).toArray(),
      (await categoryCollection()).find({}).toArray(),
      (await serviceCollection()).find({}).toArray(),
    ]);
    if (productDocs.length || categoryDocs.length || serviceDocs.length) {
      return { products: productDocs, categories: categoryDocs.length ? categoryDocs : categories, services: serviceDocs.length ? serviceDocs : jsonServices };
    }
  } catch (error) {
    console.warn("[catalog] Mongo unavailable, using JSON fallback", error instanceof Error ? error.message : error);
  }
  return { products: jsonProducts, categories, services: jsonServices };
}

export const products = jsonProducts;
export const serviceCatalog = jsonServices;
export function getProduct(slug: string) { return products.find((p) => p.slug === slug); }
export function getService(slug: string) { return serviceCatalog.find((s) => s.slug === slug); }
