import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid, Storefront } from "@/components/storefront";
import { getProductsByCategory, categories } from "@/lib/catalog";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const items = await getProductsByCategory(slug);

  return (
    <Storefront>
      <main className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[.2em] text-foreground/45">
          {category.name}
        </p>
        <h1 className="display mt-2 text-5xl font-semibold">
          {category.nameBn}
        </h1>
        <p className="mt-3 max-w-md text-sm text-foreground/60">
          {category.description}
        </p>

        <div className="mt-12">
          {items.length ? (
            <ProductGrid items={items} />
          ) : (
            <div className="border border-border p-12 text-center">
              <p className="display text-2xl">এই বিভাগে কোনো পণ্য নেই</p>
              <Link
                href="/shop"
                className="mt-6 inline-flex bg-foreground px-5 py-3 text-sm font-semibold text-background"
              >
                সব পণ্য দেখুন
              </Link>
            </div>
          )}
        </div>
      </main>
    </Storefront>
  );
}