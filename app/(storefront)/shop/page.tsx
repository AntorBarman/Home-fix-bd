import { ProductGrid, Storefront } from "@/components/storefront";
import { products } from "@/lib/catalog";
import { Search } from "lucide-react";
import Link from "next/link";

export default async function Shop({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  let items = products
    .filter((p) => !params.category || p.category === params.category)
    .filter((p) => !normalizedQuery || [p.name, p.nameBn, p.description, p.brand, p.category].some((value) => value?.toLowerCase().includes(normalizedQuery)));
  if (params.sort === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
  if (params.sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
  return <Storefront><main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7"><div><p className="text-xs uppercase tracking-[.2em] text-foreground/45">HomeFix catalogue</p><h1 className="display mt-2 text-4xl font-semibold">Shop all products</h1><p className="mt-2 text-sm text-foreground/55">{query ? `${items.length} results for '${query}'` : `${items.length} products for your everyday fixes`}</p></div><form action="/shop" method="get" className="flex items-center border-b border-foreground py-2"><Search size={17} /><input type="search" name="q" defaultValue={query} placeholder="Search products" aria-label="Search products" className="ml-2 w-40 bg-transparent text-sm outline-none" />{query && <Link href="/shop" aria-label="Clear search" className="ml-2 text-lg leading-none text-foreground/60">×</Link>}</form></div><div className="mt-8 flex flex-wrap gap-2 text-sm"><Link href="/shop" className="rounded-full border border-foreground px-4 py-2">All</Link>{["electrical","plumbing","sanitary","ac","refrigerator","tv"].map((c) => <Link key={c} href={`/shop?category=${c}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className="rounded-full border border-border px-4 py-2 capitalize">{c}</Link>)}</div><div className="mt-10">{items.length ? <ProductGrid items={items} /> : <div className="border border-border p-12 text-center"><p className="display text-2xl">কোনো পণ্য পাওয়া যায়নি / No products found for &apos;{query}&apos;</p><p className="mt-3 text-sm text-foreground/60">Try a different search term</p><Link href="/shop" className="mt-6 inline-flex bg-foreground px-5 py-3 text-sm font-semibold text-background">View all products</Link></div>}</div></main></Storefront>;
}
