import type { Metadata } from "next";
export function generateSEOMetadata({ title, description, path = "", noIndex = false }: { title: string; description: string; path?: string; noIndex?: boolean }): Metadata {
  return { title, description, alternates: { canonical: `http://localhost:3000${path}` }, robots: noIndex ? { index: false, follow: false } : undefined, openGraph: { title, description, url: `http://localhost:3000${path}`, siteName: "HomeFix BD", type: "website" } };
}
export function jsonLd(data: Record<string, unknown>) { return { __html: JSON.stringify(data) }; }
