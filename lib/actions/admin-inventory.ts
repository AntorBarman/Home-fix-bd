"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { products } from "@/lib/mongodb";
import { stockSchema } from "@/lib/schemas/admin";
export async function updateStockAction(formData: FormData) {
  await requireAdmin();
  const parsed = stockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid stock quantity." };
  const collection = await products();
  const product = await collection.findOne({ id: parsed.data.productId });
  if (!product) return { error: "Product not found." };
  const variants = product.variants.map((variant) => {
    if (variant.color !== parsed.data.color) return variant;
    return { ...variant, sizes: variant.sizes.map((size) => size.size === parsed.data.size ? { ...size, qty: parsed.data.qty } : size) };
  });
  const stockQty = variants.reduce((sum, variant) => sum + variant.sizes.reduce((inner, size) => inner + size.qty, 0), 0);
  await collection.updateOne({ id: product.id }, { $set: { variants, stockQty, inStock: stockQty > 0, updatedAt: new Date().toISOString() } });
  revalidatePath("/admin/inventory"); revalidatePath("/shop"); return { success: true };
}
