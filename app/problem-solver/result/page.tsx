import Link from "next/link";
import { Storefront } from "@/components/storefront";
import { problemReports } from "@/lib/mongodb";
import { loadCatalog } from "@/lib/catalog";

export default async function Result({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const report = id ? await (await problemReports()).findOne({ id }) : null;
  const catalog = await loadCatalog();
  const service = catalog.services.find((item) => item.slug === report?.recommendedServiceSlug) ?? catalog.services.find((item) => item.slug === "home-maintenance");
  const products = catalog.products.filter((item) => report?.recommendedProductSlugs?.includes(item.slug)).slice(0, 3);
  const confidence = report?.confidence ?? "low";
  return <Storefront><main className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><p className="text-xs uppercase tracking-[.2em] text-success">Preliminary match</p><h1 className="display mt-4 text-5xl font-semibold">{report?.category ?? "Home maintenance"}</h1><div className="mt-8 border-l-2 border-sale bg-muted p-5"><p className="font-semibold">Confidence: {confidence}</p><p className="mt-3 text-sm text-foreground/65">Matched keywords: {report?.keywords?.join(" · ") || "No exact keywords matched"}</p></div>{service && <section className="mt-8 border border-border p-6"><p className="text-xs uppercase tracking-widest text-foreground/45">Recommended service</p><h2 className="display mt-3 text-3xl font-semibold">{service.nameBn}</h2><p className="mt-2 text-sm text-foreground/60">{service.description}</p><Link href={`/booking/new?service=${service.slug}`} className="mt-6 inline-flex bg-foreground px-5 py-3 text-sm font-semibold text-background">এই সার্ভিস বুক করুন</Link></section>}{products.length > 0 && <section className="mt-8 grid gap-4 sm:grid-cols-3">{products.map((product) => <Link href={`/product/${product.slug}`} key={product.id} className="border border-border p-4"><div className="aspect-square bg-muted" /><h3 className="mt-4 font-semibold">{product.name}</h3><p className="mt-2 text-sm">৳{product.price.toLocaleString()}</p></Link>)}</section>}<p className="mt-10 border-t border-border pt-6 text-sm leading-6 text-foreground/65">এটি প্রাথমিক অনুমান। চূড়ান্ত রোগনির্ণয়ের জন্য টেকনিশিয়ানের পরিদর্শন প্রয়োজন।</p></main></Storefront>;
}
