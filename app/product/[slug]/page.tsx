import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { ProductGrid, Storefront } from "@/components/storefront";
import { getProduct, products } from "@/lib/catalog";
import { auth } from "@/auth";
import { orders, reviews } from "@/lib/mongodb";
import Link from "next/link";
import { ReviewForm } from "./review-form";

export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const session = await auth();
  const approved = await (await reviews()).find({ targetType: "product", targetId: product.id, status: "approved" }).sort({ date: -1 }).toArray();
  const purchased = Boolean(session?.user?.id && await (await orders()).findOne({ userId: session.user.id, paymentStatus: "paid", "items.productId": product.id }));
  const average = approved.length ? approved.reduce((sum, review) => sum + review.rating, 0) / approved.length : 0;
  return <Storefront><main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6"><ProductDetail product={product} /><section className="mt-20 border-t border-border pt-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="display text-3xl font-semibold">Reviews / রিভিউ</h2><p className="mt-2 text-sm text-foreground/60">{average ? `${average.toFixed(1)} / 5` : "No ratings yet"} · {approved.length} reviews</p></div>{session?.user ? purchased ? <span className="text-sm">Purchased product</span> : <span className="text-sm text-foreground/60">Purchase to review</span> : <Link href={`/signin?callbackUrl=/product/${slug}`} className="text-sm underline">Sign in to review</Link>}</div>{session?.user && purchased && <ReviewForm productId={product.id} />}<div className="mt-8 grid gap-4">{approved.map((review) => <article className="border border-border p-5" key={review.id}><div className="flex justify-between"><strong>{review.author}</strong><span>{"★".repeat(review.rating)}</span></div><h3 className="mt-2 font-semibold">{review.title}</h3><p className="mt-2 text-sm leading-6">{review.body}</p><p className="mt-3 text-xs text-foreground/50">{new Date(review.date).toLocaleDateString()}</p></article>)}</div></section><section className="mt-20 border-t border-border pt-12"><h2 className="display text-3xl font-semibold">আপনার জন্য আরও</h2><div className="mt-8"><ProductGrid items={products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)} /></div></section></main></Storefront>;
}
