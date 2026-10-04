import Link from "next/link";
import { requireSeller } from "@/lib/rbac";
import { orders, products, sellers } from "@/lib/mongodb";
import { EmptyState, StatusBadge } from "@/components/seller/seller-shell";
export default async function SellerOrders() {
  const session = await requireSeller(); const seller = await (await sellers()).findOne({ userId: session.user.id }); const ids = seller?._id ? new Set((await (await products()).find({ sellerId: seller._id.toString() }).project({ id: 1 }).toArray()).map((p) => p.id)) : new Set<string>();
  const list = await (await orders()).find({ "items.productId": { $in: [...ids] } }).sort({ createdAt: -1 }).toArray();
  return <><h2 className="display text-4xl font-semibold">Orders / অর্ডার</h2><div className="mt-6 overflow-x-auto border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{["Order #","Customer","Items","Seller total","Status","Date","Action"].map((x) => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{list.map((o) => { const items = o.items.filter((i) => i.productId && ids.has(i.productId)); const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0); return <tr className="border-t border-border" key={o.id}><td className="p-3">{o.orderNumber}</td><td className="p-3">{o.address.fullName}</td><td className="p-3">{items.length}</td><td className="p-3">৳{total.toLocaleString()}</td><td className="p-3"><StatusBadge status={o.status} /></td><td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td><td className="p-3"><Link className="underline" href={`/seller/orders/${o.id}`}>View</Link></td></tr>; })}</tbody></table>{!list.length && <EmptyState>No seller orders / কোনো অর্ডার নেই</EmptyState>}</div></>;
}
