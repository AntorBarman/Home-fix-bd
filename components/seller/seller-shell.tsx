import Link from "next/link";
import { KpiCard, StatusBadge, EmptyState } from "@/components/admin/admin-shell";

export const sellerNav = [
  ["Overview", [["/seller/dashboard", "Dashboard"]]],
  ["Catalog", [["/seller/products", "Products"], ["/seller/products/new", "Add product"], ["/seller/inventory", "Inventory"]]],
  ["Sales", [["/seller/orders", "Orders"], ["/seller/returns", "Returns"]]],
  ["Insights", [["/seller/reviews", "Reviews"], ["/seller/revenue", "Revenue"], ["/seller/payouts", "Payouts"]]],
  ["Store", [["/seller/settings", "Settings"]]],
] as const;

export function SellerSidebar() {
  return <aside className="h-fit border border-border p-4"><Link href="/seller/dashboard" className="display text-xl font-semibold">HomeFix BD Seller</Link><nav className="mt-6 grid gap-5">{sellerNav.map(([group, links]) => <div key={group}><p className="text-[10px] font-bold uppercase tracking-[.2em] text-foreground/45">{group}</p><div className="mt-2 grid gap-1 text-sm">{links.map(([href, label]) => <Link className="px-3 py-2 hover:bg-muted" href={href} key={href}>{label}</Link>)}</div></div>)}</nav></aside>;
}
export function SellerTopbar({ businessName, email }: { businessName: string; email: string }) { return <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5"><div><p className="text-xs uppercase tracking-[.2em] text-sale">Seller workspace</p><h1 className="display text-2xl font-semibold">{businessName}</h1></div><div className="text-right text-sm text-foreground/60">{email}<div className="mt-1"><Link href="/shop" className="underline">View storefront</Link></div></div></header>; }
export { KpiCard, StatusBadge, EmptyState };
