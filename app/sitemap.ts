import type { MetadataRoute } from "next";
import { products, serviceCatalog } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "http://localhost:3000";
  return [
    "", "/shop", "/categories", "/services", "/problem-solver", "/technicians", "/blog", "/about", "/contact", "/faq",
    ...products.map((p) => `/product/${p.slug}`),
    ...serviceCatalog.map((s) => `/service/${s.slug}`),
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
}
