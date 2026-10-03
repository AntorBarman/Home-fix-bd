import { requireAdmin } from "@/lib/rbac";
import { categories } from "@/lib/mongodb";
export default async function Categories() { await requireAdmin(); const list = await (await categories()).find({}).sort({ name: 1 }).toArray(); return <div><h2 className="display text-4xl font-semibold">Categories / ক্যাটাগরি</h2><div className="mt-8 divide-y divide-border border-y border-border">{list.map((category) => <div className="flex justify-between py-4 text-sm" key={category.id}><span><strong>{category.name}</strong> · {category.nameBn}</span><span>{category.slug}</span></div>)}</div></div>; }
