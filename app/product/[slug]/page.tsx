import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { ProductGrid, Storefront } from "@/components/storefront";
import { getProduct, products } from "@/lib/catalog";

export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <Storefront><main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6"><ProductDetail product={product} /><section className="mt-20 border-t border-border pt-12"><h2 className="display text-3xl font-semibold">আপনার জন্য আরও</h2><div className="mt-8"><ProductGrid items={products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)} /></div></section></main></Storefront>;
}
