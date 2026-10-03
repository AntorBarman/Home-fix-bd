import { notFound } from "next/navigation";
import posts from "@/data/posts.json";
export function generateStaticParams() { return posts.map((post) => ({ slug: post.slug })); }
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const post = posts.find((item) => item.slug === slug); if (!post) notFound(); return <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><p className="text-xs uppercase tracking-[.2em] text-sale">{post.category} · {post.readTime}</p><h1 className="display mt-4 text-5xl font-semibold">{post.titleBn}</h1><p className="mt-4 text-foreground/60">{post.excerpt}</p><div className="mt-10 grid gap-6 leading-8">{post.blocks.map((block, index) => <p key={index}>{block.text}</p>)}</div></article>; }
