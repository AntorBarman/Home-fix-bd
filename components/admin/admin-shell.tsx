import Link from "next/link";

export const adminGroups = [
  ["Overview", [["/admin/dashboard", "Dashboard"], ["/admin/analytics", "Analytics"]]],
  ["Catalog", [["/admin/products", "Products"], ["/admin/categories", "Categories"], ["/admin/services", "Services"], ["/admin/inventory", "Inventory"]]],
  ["Sales", [["/admin/orders", "Orders"], ["/admin/bookings", "Bookings"]]],
  ["Users", [["/admin/customers", "Customers"], ["/admin/technicians", "Technicians"], ["/admin/sellers", "Sellers"]]],
  ["Trust", [["/admin/reviews", "Reviews"], ["/admin/complaints", "Complaints"], ["/admin/warranties", "Warranties"]]],
  ["Store", [["/admin/coupons", "Coupons"], ["/admin/settings", "Settings"], ["/admin/profile", "Profile"]]],
] as const;

export function AdminSidebar() {
  return <aside className="h-fit border border-border p-4"><Link href="/admin/dashboard" className="display text-xl font-semibold">HomeFix BD Admin</Link><nav className="mt-6 grid gap-5">{adminGroups.map(([group, links]) => <div key={group}><p className="text-[10px] font-bold uppercase tracking-[.2em] text-foreground/45">{group}</p><div className="mt-2 grid gap-1 text-sm">{links.map(([href, label]) => <Link className="px-3 py-2 hover:bg-muted" href={href} key={href}>{label}</Link>)}</div></div>)}</nav></aside>;
}

export function AdminTopbar({ email }: { email: string }) {
  return <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5"><div><p className="text-xs uppercase tracking-[.2em] text-sale">Operations</p><h1 className="display text-2xl font-semibold">Admin control room</h1></div><div className="text-right text-sm text-foreground/60">{email}<div className="mt-1"><Link href="/" className="underline">View storefront</Link></div></div></header>;
}

export function KpiCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) { return <div className="bg-muted p-5"><p className="text-sm text-foreground/55">{label}</p><strong className="display mt-2 block text-3xl">{value}</strong>{detail && <p className="mt-2 text-xs text-foreground/50">{detail}</p>}</div>; }
export function StatusBadge({ status }: { status: string }) { return <span className="border border-border px-2 py-1 text-xs uppercase tracking-wider">{status.replaceAll("_", " ")}</span>; }
export function EmptyState({ children = "No records found." }: { children?: React.ReactNode }) { return <p className="border border-border p-8 text-center text-foreground/55">{children}</p>; }
