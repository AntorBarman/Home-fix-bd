"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/rbac";
import { orders, products, reviews } from "@/lib/mongodb";
import { reviewSchema } from "@/lib/schemas/review";
export async function submitReviewAction(formData: FormData) {
  const session = await requireUser();
  if (session.user.role !== "customer") return { error: "শুধু কাস্টমার রিভিউ দিতে পারবেন।" };
  const parsed = reviewSchema.safeParse({ productId: formData.get("productId"), rating: formData.get("rating"), title: formData.get("title"), body: formData.get("body"), photos: String(formData.get("photos") || "").split("\n").filter(Boolean) });
  if (!parsed.success) return { error: "Please check the review details.", fieldErrors: parsed.error.flatten().fieldErrors };
  const purchased = await (await orders()).findOne({ userId: session.user.id, paymentStatus: "paid", "items.productId": parsed.data.productId });
  if (!purchased) return { error: "You can review products you have purchased." };
  const product = await (await products()).findOne({ id: parsed.data.productId });
  await (await reviews()).insertOne({ id: crypto.randomUUID(), targetType: "product", targetId: parsed.data.productId, author: session.user.name || session.user.email, authorEmail: session.user.email, ...parsed.data, status: "pending", date: new Date().toISOString() });
  if (product?.slug) revalidatePath(`/product/${product.slug}`);
  return { success: true };
}
export async function approveReviewAction(reviewId: string) { await requireAdmin(); await (await reviews()).updateOne({ id: reviewId }, { $set: { status: "approved" } }); revalidatePath("/admin/reviews"); return { success: true }; }
export async function rejectReviewAction(reviewId: string, reason: string) { await requireAdmin(); await (await reviews()).updateOne({ id: reviewId }, { $set: { status: "rejected", reason } }); revalidatePath("/admin/reviews"); return { success: true }; }
