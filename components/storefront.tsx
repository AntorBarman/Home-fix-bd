"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Heart, Menu, Search, ShoppingBag, Sparkles, Star, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { formatShopPrice } from "@/lib/money";
import type { Product } from "@/types";
import { NewsletterForm } from "@/components/newsletter-form";

const cartKey = "homefixbd-cart";

export function ProductArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  const tones: Record<string, string> = { electrical: "from-[#d8e6e0] to-[#f4ede6]", plumbing: "from-[#dce7e9] to-[#f4ede6]", sanitary: "from-[#eee5d7] to-[#fafaf8]", ac: "from-[#dbe6eb] to-[#f4ede6]", refrigerator: "from-[#e4e0d9] to-[#fafaf8]", tv: "from-[#ddd9e4] to-[#f4ede6]" };
  return <div className={`relative overflow-hidden rounded-[2px] bg-linear-to-br ${tones[product.category] ?? "from-muted to-background"} ${compact ? "h-36" : "h-72"}`}>
    <div className="absolute inset-0 opacity-30 paper-grid" />
    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[76px] font-light text-foreground/75">{product.category === "electrical" ? "⌁" : product.category === "plumbing" ? "◒" : product.category === "ac" ? "❄" : product.category === "refrigerator" ? "▣" : product.category === "tv" ? "▤" : "◌"}</div>
    <div className="absolute bottom-3 left-3 rounded-full bg-background/80 px-2 py-1 text-[10px] uppercase tracking-[.18em]">{product.brand}</div>
  </div>;
}

export function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  function add() {
    const raw = localStorage.getItem(cartKey);
    const cart = raw ? JSON.parse(raw) as { productId: string; slug: string; name: string; image: string; color: string; size: string; qty: number; addInstallation: boolean }[] : [];
    const variant = product.variants[0];
    const size = variant.sizes[0].size;
    const index = cart.findIndex((line) => line.productId === product.id && line.color === variant.color && line.size === size);
    if (index >= 0) cart[index].qty += 1;
    else cart.push({ productId: product.id, slug: product.slug, name: product.name, image: product.image, color: variant.color, size, qty: 1, addInstallation: false });
    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-change"));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }
  return <article className="group min-w-0">
    <Link href={`/product/${product.slug}`} className="relative block">
      <ProductArt product={product} />
      {product.badge && <span className="absolute left-3 top-3 bg-sale px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">{product.badge}</span>}
      <button aria-label="Add to wishlist" onClick={(e) => e.preventDefault()} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100"><Heart size={16} /></button>
    </Link>
    <div className="pt-3">
      <Link href={`/category/${product.category}`} className="text-[10px] uppercase tracking-[.16em] text-foreground/50">{product.category}</Link>
      <Link href={`/product/${product.slug}`}><h3 className="mt-1 font-medium leading-tight">{product.name}</h3></Link>
      <div className="mt-2 flex items-center gap-1 text-xs"><Star size={13} className="fill-sale text-sale" /> {product.rating} <span className="text-foreground/45">({product.reviewCount})</span></div>
      <div className="mt-2 flex items-center gap-2"><span className="font-semibold">{formatShopPrice(product.price)}</span>{product.compareAtPrice && <span className="text-xs text-foreground/40 line-through">{formatShopPrice(product.compareAtPrice)}</span>}</div>
      <button disabled={!product.inStock} onClick={add} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 border border-foreground px-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40">{added ? <><Check size={14} /> Added</> : product.inStock ? "Add to cart" : "Sold out"}</button>
    </div>
  </article>;
}

export function Header() {
  const [count, setCount] = useState(0);
  const [menu, setMenu] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session } = useSession();
  const role = session?.user?.role;
  const firstName = session?.user?.name?.split(" ")[0] || "Account";
  const accountLinks = [
    { href: "/account", label: "Account", visible: true },
    { href: "/account/orders", label: "Orders", visible: true },
    { href: "/account/bookings", label: "Bookings", visible: true },
    { href: "/admin", label: "Admin", visible: role === "admin" },
    { href: "/technician", label: "Technician dashboard", visible: role === "technician" },
    { href: "/seller", label: "Seller dashboard", visible: role === "seller" },
  ];
  useEffect(() => {
    const sync = () => { const raw = localStorage.getItem(cartKey); setCount(raw ? (JSON.parse(raw) as { qty: number }[]).reduce((a, b) => a + b.qty, 0) : 0); };
    sync(); window.addEventListener("cart-change", sync); return () => window.removeEventListener("cart-change", sync);
  }, []);
  return <header className="border-b border-border bg-background">
    <div className="hidden border-b border-border bg-foreground px-4 py-2 text-center text-xs text-background md:block">বিশ্বস্ত মিস্ত্রি, এক ক্লিকেই · ৳৫০০০+ অর্ডারে ফ্রি ডেলিভারি · 9:00am – 9:00pm</div>
    <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-5 sm:px-6">
      <button aria-label="Open menu" onClick={() => setMenu(true)} className="md:hidden"><Menu /></button>
      <Link href="/" className="display text-2xl font-bold tracking-tight">HomeFix <span className="text-sale">BD</span></Link>
      <div className="hidden flex-1 md:block"><div className="mx-auto flex max-w-xl items-center gap-2 border-b border-foreground/30 pb-2 text-sm text-foreground/55"><Search size={16} /> ঘরের জন্য কী খুঁজছেন?</div></div>
      <nav className="ml-auto flex items-center gap-3 text-sm"><Link href="/shop" className="hidden md:block">Shop</Link><Link href="/services" className="hidden md:block">Services</Link><Link href="/problem-solver" className="hidden sm:block">Problem solver</Link>{session ? <div className="relative hidden md:block"><button onClick={() => setAccountOpen((open) => !open)} className="min-h-10 border border-border px-3 text-sm font-medium">{firstName}</button>{accountOpen && <div className="absolute right-0 top-12 z-40 grid min-w-48 gap-1 border border-border bg-background p-2 shadow-lg">{accountLinks.filter((item) => item.visible).map((item) => <Link key={item.href} href={item.href} onClick={() => setAccountOpen(false)} className="px-3 py-2 text-sm hover:bg-muted">{item.label}</Link>)}<button onClick={() => signOut({ callbackUrl: "/" })} className="border-t border-border px-3 py-2 text-left text-sm hover:bg-muted">Sign out</button></div>}</div> : <Link href="/signin" className="hidden min-h-10 items-center px-2 font-medium md:flex">Sign In</Link>}<Link href="/cart" className="relative flex items-center gap-1"><ShoppingBag size={19} /><span className="text-xs">{count}</span></Link></nav>
    </div>
    <div className="hidden border-t border-border md:block"><nav className="mx-auto flex max-w-[1400px] items-center gap-7 px-4 py-3 text-sm sm:px-6"><Link href="/categories" className="font-semibold">Shop by categories</Link><Link href="/technicians">Technicians</Link><Link href="/blog">Journal</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><span className="ml-auto text-xs text-foreground/50">Dhaka · Mirpur · Uttara · Gulshan</span></nav></div>
    {menu && <div className="fixed inset-0 z-50 bg-background p-5 md:hidden"><div className="flex items-center justify-between"><span className="display text-2xl font-bold">HomeFix <span className="text-sale">BD</span></span><button onClick={() => setMenu(false)} aria-label="Close menu"><X /></button></div><div className="mt-8 grid gap-5 text-2xl font-medium">{session ? <div className="grid gap-3 border-b border-border pb-6 text-base font-medium"><p className="display text-2xl">Hi, {firstName}</p>{accountLinks.filter((item) => item.visible).map((item) => <Link key={item.href} href={item.href} onClick={() => setMenu(false)}>{item.label}</Link>)}<button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-sale">Sign out</button></div> : <div className="grid gap-3 border-b border-border pb-6 text-base font-medium"><Link href="/signin" onClick={() => setMenu(false)}>Sign In</Link><Link href="/register" onClick={() => setMenu(false)} className="text-sale">Sign Up</Link></div>}<Link href="/shop" onClick={() => setMenu(false)}>Shop</Link><Link href="/services" onClick={() => setMenu(false)}>Services</Link><Link href="/technicians" onClick={() => setMenu(false)}>Technicians</Link><Link href="/problem-solver" onClick={() => setMenu(false)}>Problem solver</Link><Link href="/blog" onClick={() => setMenu(false)}>Journal</Link></div></div>}
  </header>;
}

export function Footer() {
  return <footer className="mt-20 border-t border-border bg-muted"><div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-4"><div className="md:col-span-1"><div className="display text-2xl font-bold">HomeFix <span className="text-sale">BD</span></div><p className="mt-3 max-w-xs text-sm leading-6 text-foreground/60">বাসার সব প্রয়োজন, এক প্ল্যাটফর্মে। পণ্য কিনুন, বিশ্বস্ত মিস্ত্রি বুক করুন।</p><p className="mt-6 text-sm">+880 1700-000000</p></div><div><h3 className="text-xs font-bold uppercase tracking-widest">Explore</h3><div className="mt-4 grid gap-3 text-sm text-foreground/65"><Link href="/shop">Shop all products</Link><Link href="/services">Home services</Link><Link href="/technicians">Find a technician</Link><Link href="/blog">Home journal</Link></div></div><div><h3 className="text-xs font-bold uppercase tracking-widest">Help</h3><div className="mt-4 grid gap-3 text-sm text-foreground/65"><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link><Link href="/returns">Returns</Link><Link href="/terms">Terms</Link></div></div><div><h3 className="text-xs font-bold uppercase tracking-widest">Keep in touch</h3><p className="mt-4 text-sm leading-6 text-foreground/65">নতুন পণ্য, মৌসুমি চেকলিস্ট ও সার্ভিস টিপস।</p><NewsletterForm /></div></div><div className="border-t border-border px-4 py-5 text-center text-xs text-foreground/50">© 2026 HomeFix BD · BDT · bKash · Nagad · SSLCOMMERZ</div></footer>;
}

export function Dock() { return <aside className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 lg:flex"><Link href="/cart" className="rounded-full bg-foreground px-4 py-3 text-xs font-semibold text-background shadow-lg">Bag</Link><Link href="/wishlist" className="rounded-full border border-border bg-background px-4 py-3 text-xs font-semibold shadow-lg">Wishlist</Link><Link href="/booking/new" className="rounded-full bg-sale px-4 py-3 text-xs font-semibold text-white shadow-lg">Book a tech</Link></aside>; }

export function Storefront({ children }: { children: React.ReactNode }) { return <><Header />{children}<Dock /><Footer /></>; }

export function ProductGrid({ items }: { items: Product[] }) { return <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>; }

export function Hero() { return <section className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1.4fr_.6fr]"><div className="paper-grid relative min-h-[470px] overflow-hidden bg-muted p-7 sm:p-12"><div className="relative z-10 max-w-lg"><p className="text-xs font-bold uppercase tracking-[.22em] text-sale">Home, made easier</p><h1 className="display mt-5 text-5xl font-semibold leading-[.95] sm:text-7xl">ঘরের কাজ,<br /><span className="text-sale">সহজ</span> হোক।</h1><p className="mt-6 max-w-sm text-base leading-7 text-foreground/65">পছন্দের পণ্য আর ভরসার মিস্ত্রি—আপনার ঘরের জন্য এক জায়গায়।</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="inline-flex min-h-12 items-center gap-3 bg-foreground px-6 text-sm font-semibold text-background">Shop collection <ArrowRight size={16} /></Link><Link href="/problem-solver" className="inline-flex min-h-12 items-center gap-3 border border-foreground px-6 text-sm font-semibold">Describe a problem</Link></div></div><div className="absolute bottom-0 right-0 flex h-72 w-72 items-center justify-center rounded-full bg-[#d8e6e0] text-[150px] text-foreground/70 sm:h-96 sm:w-96">⌁</div><div className="absolute bottom-6 right-8 z-10 border border-foreground/20 bg-background/75 px-3 py-2 text-xs">From ৳120 · built for Bangladesh</div></div><div className="flex min-h-[470px] flex-col justify-between bg-foreground p-7 text-background sm:p-10"><div><Sparkles className="text-sale" size={24} /><p className="mt-8 text-xs uppercase tracking-[.2em] text-background/50">Problem solver</p><h2 className="display mt-4 text-4xl leading-tight">পানি পড়ছে?<br />আজই বলুন।</h2><p className="mt-4 text-sm leading-6 text-background/65">আপনার সমস্যার কথা লিখুন। আমরা সঠিক সার্ভিস ও মিস্ত্রির পথ দেখাব।</p></div><Link href="/problem-solver" className="flex items-center justify-between border-t border-background/25 pt-5 text-sm">Start with a problem <ArrowRight size={17} /></Link></div></section>; }

export function HomeSections({ products }: { products: Product[] }) {
  const featured = useMemo(() => products.filter((p) => p.featured), [products]);
  return <><Hero /><main className="mx-auto max-w-[1400px] px-4 sm:px-6"><section className="py-14"><div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-foreground/45">Find your fix</p><h2 className="display mt-2 text-3xl font-semibold">জনপ্রিয় বিভাগ</h2></div><Link href="/categories" className="text-sm underline underline-offset-4">সব বিভাগ দেখুন</Link></div><div className="hide-scrollbar mt-8 flex gap-4 overflow-x-auto pb-2">{["electrical","plumbing","sanitary","ac","refrigerator","tv"].map((id) => <Link href={`/category/${id}`} key={id} className="min-w-32 text-center sm:min-w-40"><div className="flex aspect-square items-center justify-center rounded-full border border-border bg-muted text-5xl transition hover:scale-105">{id === "electrical" ? "⌁" : id === "plumbing" ? "◒" : id === "ac" ? "❄" : id === "tv" ? "▤" : "◌"}</div><p className="mt-3 text-sm font-medium capitalize">{id}</p></Link>)}</div></section><section className="border-t border-border py-14"><div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-foreground/45">Curated for your home</p><h2 className="display mt-2 text-3xl font-semibold">এই সপ্তাহের পছন্দ</h2></div><Link href="/shop" className="text-sm underline underline-offset-4">সব পণ্য</Link></div><div className="mt-8"><ProductGrid items={featured} /></div></section><section className="my-6 grid min-h-72 items-center overflow-hidden bg-[#ded6c9] px-7 sm:px-14"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-sale">Made for the monsoon</p><h2 className="display mt-3 text-4xl font-semibold sm:text-5xl">ছোট লিক, বড় ঝামেলা নয়।</h2><p className="mt-3 max-w-md text-sm leading-6 text-foreground/65">পাইপ রিপেয়ার কিট থেকে শুরু করে বাসায় আসা মিস্ত্রি—প্রথমে সমস্যাটা বলুন।</p><Link href="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Explore services <ArrowRight size={16} /></Link></div></section><section className="py-16"><div className="grid gap-4 sm:grid-cols-3"><div className="border-t-2 border-foreground pt-4"><p className="display text-xl font-semibold">ফ্রি ডেলিভারি</p><p className="mt-2 text-sm text-foreground/55">৳৫০০০+ অর্ডারে</p></div><div className="border-t-2 border-foreground pt-4"><p className="display text-xl font-semibold">ভেরিফাইড মিস্ত্রি</p><p className="mt-2 text-sm text-foreground/55">NID যাচাইকৃত</p></div><div className="border-t-2 border-foreground pt-4"><p className="display text-xl font-semibold">সার্ভিস ওয়ারেন্টি</p><p className="mt-2 text-sm text-foreground/55">৭ দিন থেকে শুরু</p></div></div></section></main></>;
}
