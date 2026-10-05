export const revalidate = 3600;  

import Link from "next/link";
import posts from "@/data/posts.json";
export default function BlogPage() { return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><p className="text-xs uppercase tracking-[.2em] text-sale">Journal</p><h1 className="display mt-3 text-5xl font-semibold">HomeFix Journal</h1><div className="mt-10 grid gap-5 md:grid-cols-3">{posts.map((post) => <Link href={`/blog/${post.slug}`} className="border border-border p-5" key={post.slug}><p className="text-xs text-foreground/50">{post.category} · {post.readTime}</p><h2 className="display mt-3 text-2xl font-semibold">{post.titleBn}</h2><p className="mt-3 text-sm text-foreground/60">{post.excerpt}</p></Link>)}</div></main>; }
