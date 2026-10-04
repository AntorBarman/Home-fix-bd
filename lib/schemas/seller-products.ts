import { z } from "zod";

const variant = z.object({
  color: z.string().min(1),
  colorHex: z.string().min(1),
  sizes: z.array(z.object({ size: z.string().min(1), qty: z.coerce.number().int().nonnegative() })),
  image: z.string().default(""),
});

export const sellerProductSchema = z.object({
  id: z.string().optional(), name: z.string().min(2), nameBn: z.string().min(2),
  sku: z.string().min(2), slug: z.string().min(2), brand: z.string().min(1), category: z.string().min(1),
  description: z.string().min(2), descriptionBn: z.string().default(""), image: z.string().min(1),
  hoverImage: z.string().default(""), price: z.coerce.number().nonnegative(),
  compareAtPrice: z.coerce.number().nonnegative().optional(), badge: z.enum(["", "new", "hot", "sale"]).optional(),
  published: z.coerce.boolean().default(false), installable: z.coerce.boolean().default(false),
  installServiceSlug: z.string().optional(), variants: z.array(variant).default([]),
  materials: z.array(z.string()).default([]), features: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.string()).default({}),
});

export const sellerStockSchema = z.object({
  productId: z.string().min(1), color: z.string().min(1), size: z.string().min(1), qty: z.coerce.number().int().nonnegative(),
});
