import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { users } from "@/lib/mongodb";
export default async function Customers() { await requireAdmin(); const list = await (await users()).find({ role: "customer" }).sort({ createdAt: -1 }).toArray(); return <div><h2 className="display text-4xl font-semibold">Customers / গ্রাহক</h2><div className="mt-8 divide-y divide-border border-y border-border">{list.map((user) => <Link href={`/admin/customers/${user.id || user.email}`} className="flex justify-between py-4 text-sm" key={user.email}><span><strong>{user.name}</strong><br />{user.email} · {user.phone || "No phone"}</span><span>{user.createdAt}</span></Link>)}</div></div>; }
