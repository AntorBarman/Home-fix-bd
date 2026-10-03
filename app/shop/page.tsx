import { ProductGrid, Storefront } from "@/components/storefront";
import { products } from "@/lib/catalog";
import { Search } from "lucide-react";
import Link from "next/link";

export default async function Shop({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const params = await searchParams;
  let items = products.filter((p) => !params.category || p.category === params.category).filter((p) => !params.q || `${p.name} ${p.nameBn}`.toLowerCase().includes(params.q.toLowerCase()));
  if (params.sort === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
  if (params.sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
  return <Storefront><main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7"><div><p className="text-xs uppercase tracking-[.2em] text-foreground/45">HomeFix catalogue</p><h1 className="display mt-2 text-4xl font-semibold">Shop all products</h1><p className="mt-2 text-sm text-foreground/55">{items.length} products for your everyday fixes</p></div><form className="flex border-b border-foreground py-2"><Search size={17} /><input name="q" defaultValue={params.q} placeholder="Search products" className="ml-2 w-40 bg-transparent text-sm outline-none" /></form></div><div className="mt-8 flex flex-wrap gap-2 text-sm"><Link href="/shop" className="rounded-full border border-foreground px-4 py-2">All</Link>{["electrical","plumbing","sanitary","ac","refrigerator","tv"].map((c) => <Link key={c} href={`/shop?category=${c}`} className="rounded-full border border-border px-4 py-2 capitalize">{c}</Link>)}</div><div className="mt-10"><ProductGrid items={items} /></div></main></Storefront>;
}
