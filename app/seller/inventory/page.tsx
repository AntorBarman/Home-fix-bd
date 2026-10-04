import { requireSeller } from "@/lib/rbac";
import { products, sellers } from "@/lib/mongodb";
import { updateSellerStockAction } from "@/lib/actions/seller-inventory";
import { EmptyState, StatusBadge } from "@/components/seller/seller-shell";
export default async function SellerInventory() {
  const session = await requireSeller(); const seller = await (await sellers()).findOne({ userId: session.user.id }); const list = seller?._id ? await (await products()).find({ sellerId: seller._id.toString() }).toArray() : [];
  const rows = list.flatMap((p) => p.variants.flatMap((v) => v.sizes.map((s) => ({ p, v, s }))));
  async function save(formData: FormData) { "use server"; await updateSellerStockAction(formData); }
  return <><h2 className="display text-4xl font-semibold">Inventory / ইনভেন্টরি</h2><div className="mt-6 overflow-x-auto border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{["Product","Color","Size","Qty","Status","Action"].map((x) => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(({ p, v, s }) => <tr className="border-t border-border" key={`${p.id}-${v.color}-${s.size}`}><td className="p-3">{p.name}</td><td className="p-3">{v.color}</td><td className="p-3">{s.size}</td><td className="p-3">  <form action={save} className="flex gap-2"><input type="hidden" name="productId" value={p.id} /><input type="hidden" name="color" value={v.color} /><input type="hidden" name="size" value={s.size} /><input name="qty" type="number" min="0" defaultValue={s.qty} className="w-20 border border-border px-2 py-1" /><button className="underline">Save</button></form></td><td className="p-3"><StatusBadge status={s.qty === 0 ? "out of stock" : s.qty <= 5 ? "low stock" : "in stock"} /></td><td className="p-3">৳—</td></tr>)}</tbody></table>{!rows.length && <EmptyState>No variants found / কোনো ভ্যারিয়েন্ট নেই</EmptyState>}</div></>;
}
