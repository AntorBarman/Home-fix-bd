"use server";
import { revalidatePath } from "next/cache";
import { products, sellers } from "@/lib/mongodb";
import { requireSeller } from "@/lib/rbac";
import { sellerStockSchema } from "@/lib/schemas/seller-products";

export async function updateSellerStockAction(formData: FormData) {
  const session = await requireSeller();
  const seller = await (await sellers()).findOne({ userId: session.user.id });
  if (!seller?._id) throw new Error("Seller profile not found");
  const parsed = sellerStockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid stock quantity." };
  const { productId, color, size, qty } = parsed.data;
  const collection = await products();
  const product = await collection.findOne({ id: productId, sellerId: seller._id.toString() });
  if (!product) return { error: "Product not found." };
  const variants = (product.variants ?? []).map((v) => v.color === color ? { ...v, sizes: v.sizes.map((s) => s.size === size ? { ...s, qty } : s) } : v);
  const stockQty = variants.flatMap((v) => v.sizes).reduce((sum, s) => sum + s.qty, 0);
  await collection.updateOne({ id: productId, sellerId: seller._id.toString() }, { $set: { variants, stockQty, inStock: stockQty > 0, updatedAt: new Date().toISOString() } });
  revalidatePath("/seller/inventory"); return { success: true };
}
