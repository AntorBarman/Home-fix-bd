import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { orders } from "@/lib/mongodb";

export default async function OrdersPage() {
  const session = await requireUser();

  const myOrders = await (await orders())
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-[.2em] text-foreground/45">
        HomeFix BD · Account / Orders
      </p>
      <h1 className="display mt-2 text-4xl font-semibold">
        আপনার অর্ডার
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        সব অর্ডারের তালিকা ও স্ট্যাটাস।
      </p>

      <div className="mt-8 grid gap-3">
        {myOrders.length ? (
          myOrders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="grid gap-3 border border-border p-5 hover:bg-muted sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
            >
              <div>
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="mt-1 text-xs text-foreground/50">
                  {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                  {order.items.length} item
                  {order.items.length > 1 ? "s" : ""}
                </p>
              </div>
              <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">
                {order.status}
              </span>
              <span className="font-semibold">
                ৳{(order.total || 0).toLocaleString()}
              </span>
              <span className="text-xs uppercase text-foreground/50">
                {order.paymentMethod}
              </span>
            </Link>
          ))
        ) : (
          <div className="border border-border p-12 text-center">
            <p className="display text-2xl">এখনো কোনো অর্ডার নেই</p>
            <p className="mt-3 text-sm text-foreground/60">
              প্রথম অর্ডার করতে শপে যান।
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex bg-foreground px-5 py-3 text-sm font-semibold text-background"
            >
              Browse products
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}