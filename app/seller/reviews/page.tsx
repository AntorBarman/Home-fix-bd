import { requireSeller } from "@/lib/rbac";
import { products, reviews, sellers } from "@/lib/mongodb";
import { EmptyState } from "@/components/seller/seller-shell";
export default async function SellerReviews() {
  const session = await requireSeller(); const seller = await (await sellers()).findOne({ userId: session.user.id }); const ids = seller?._id ? (await (await products()).find({ sellerId: seller._id.toString() }).project({ id: 1 }).toArray()).map((p) => p.id) : []; const list = await (await reviews()).find({ targetType: "product", targetId: { $in: ids }, status: "approved" }).sort({ date: -1 }).toArray();
  return <><h2 className="display text-4xl font-semibold">Reviews / রিভিউ</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{list.map((r) => <article className="border border-border p-5" key={r.id}><p className="text-sale">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p><p className="mt-3">{r.body}</p><p className="mt-4 text-sm text-foreground/60">{r.author} · {new Date(r.date).toLocaleDateString()}</p></article>)}{!list.length && <EmptyState>No approved reviews / কোনো রিভিউ নেই</EmptyState>}</div></>;
}
