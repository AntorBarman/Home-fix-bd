"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { ProductArt } from "@/components/storefront";
import { useSession } from "next-auth/react";
import type { Product } from "@/types";

export function ProductDetail({ product }: { product: Product }) {
  const [variant, setVariant] = useState(product.variants[0]);
  const [size, setSize] = useState(variant.sizes[0].size);
  const [added, setAdded] = useState(false);
  const { data: session } = useSession();
  const canBuy = !session || session.user.role === "customer";
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  function add() {
    const raw = localStorage.getItem("homefixbd-cart");
    const lines = raw ? JSON.parse(raw) as { productId: string; slug: string; name: string; image: string; color: string; size: string; qty: number; addInstallation: boolean }[] : [];
    const index = lines.findIndex((line) => line.productId === product.id && line.color === variant.color && line.size === size);
    if (index >= 0) lines[index].qty += 1;
    else lines.push({ productId: product.id, slug: product.slug, name: product.name, image: selectedImage, color: variant.color, size, qty: 1, addInstallation: false });
    localStorage.setItem("homefixbd-cart", JSON.stringify(lines));
    window.dispatchEvent(new Event("cart-change"));
    setAdded(true);
  }
  const gallery = product.images?.length ? product.images : product.gallery?.length ? product.gallery : [product.image];
  const selectedImage = selectedGalleryImage || variant.image || gallery[0] || product.image;
  return <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]"><div><ProductArt product={{ ...product, image: selectedImage, hoverImage: gallery[1] || selectedImage }} /><div className="mt-3 grid grid-cols-4 gap-2">{gallery.slice(0, 4).map((image, index) => <button type="button" key={image} onClick={() => setSelectedGalleryImage(image)} className={`overflow-hidden border ${selectedImage === image ? "border-foreground" : "border-border"}`}><div className="relative aspect-square"><Image src={image} alt={`${product.name} view ${index + 1}`} fill unoptimized className="object-cover" /></div></button>)}</div></div><div className="max-w-xl py-3"><p className="text-xs uppercase tracking-[.2em] text-foreground/45">{product.brand} · {product.category}</p><h1 className="display mt-4 text-4xl font-semibold sm:text-5xl">{product.nameBn}</h1><p className="mt-2 text-foreground/55">{product.name}</p><div className="mt-6 text-2xl font-semibold">৳{product.price.toLocaleString()}</div><p className="mt-6 leading-7 text-foreground/65">{product.description}</p><div className="mt-8 border-t border-border pt-6"><p className="text-sm font-semibold">Choose colour</p><div className="mt-3 flex gap-3">{product.variants.map((v) => <button key={v.color} onClick={() => { setVariant(v); setSize(v.sizes[0].size); setSelectedGalleryImage(null); }} aria-label={v.color} className={`h-9 w-9 rounded-full border-2 border-background ring-1 ${variant.color === v.color ? "ring-foreground" : "ring-foreground/30"}`} style={{ backgroundColor: v.colorHex }} />)}</div><p className="mt-6 text-sm font-semibold">Choose size</p><div className="mt-3 flex flex-wrap gap-2">{variant.sizes.map((s) => <button key={s.size} onClick={() => setSize(s.size)} className={`border px-4 py-2 text-sm ${size === s.size ? "border-foreground bg-foreground text-background" : "border-border"}`}>{s.size}</button>)}</div></div>{canBuy ? <button onClick={add} className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 bg-foreground text-sm font-semibold text-background">{added ? <><Check size={16} /> Added to bag</> : "Add to cart"}</button> : <p className="mt-8 text-center text-sm text-foreground/60">এই পণ্য ক্রয় করতে কাস্টমার অ্যাকাউন্ট দরকার।</p>}<Link href="/cart" className="mt-3 flex min-h-12 items-center justify-center border border-foreground text-sm font-semibold">View bag</Link><div className="mt-8 grid gap-3 border-t border-border pt-6 text-sm text-foreground/65">{product.features.map((f) => <div key={f}>✓ {f}</div>)}</div></div></div>;
}
