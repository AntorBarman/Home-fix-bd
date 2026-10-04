import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/rbac";
import { products, sellers } from "@/lib/mongodb";
import { toPlain } from "@/lib/serializers";
import { SellerProductForm } from "../product-form";
export default async function EditSellerProduct({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSeller(); const seller = await (await sellers()).findOne({ userId: session.user.id }); const { id } = await params;
  const product = seller?._id ? await (await products()).findOne({ id, sellerId: seller._id.toString() }) : null; if (!product) notFound();
  return <><h2 className="display text-4xl font-semibold">Edit product / পণ্য সম্পাদনা</h2><SellerProductForm product={toPlain(product)} /></>;
}
