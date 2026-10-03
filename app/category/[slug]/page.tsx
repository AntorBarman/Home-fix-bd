import { notFound } from "next/navigation";
import { ProductGrid, Storefront } from "@/components/storefront";
import { categories, products } from "@/lib/catalog";
export function generateStaticParams() { return categories.map((category) => ({ slug: category.slug })); }
export default async function Category({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const category = categories.find((c) => c.slug === slug); if (!category) notFound(); return <Storefront><main className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6"><p className="text-xs uppercase tracking-[.2em] text-foreground/45">Category</p><h1 className="display mt-2 text-5xl font-semibold">{category.nameBn}</h1><p className="mt-3 max-w-xl text-foreground/60">{category.description}</p><div className="mt-10"><ProductGrid items={products.filter((p) => p.category === slug)} /></div></main></Storefront>; }
