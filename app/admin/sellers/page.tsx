import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { sellers } from "@/lib/mongodb";
export default async function Sellers() { await requireAdmin(); const list = await (await sellers()).find({}).sort({ createdAt: -1 }).toArray(); return <div><h2 className="display text-4xl font-semibold">Sellers / বিক্রেতা</h2><div className="mt-8 divide-y divide-border border-y border-border">{list.map((seller) => <Link href={`/admin/sellers/${seller.userId}`} className="flex justify-between py-4 text-sm" key={seller.userId}><span><strong>{seller.businessName}</strong><br />{seller.ownerName} · {seller.phone}</span><span>{seller.verificationStatus}</span></Link>)}</div></div>; }
