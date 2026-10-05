import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { orders } from "@/lib/mongodb";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();

  const order = await (await orders()).findOne({
    id,
    userId: session.user.id,
  });

  if (!order) notFound();

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-900",
    paid: "bg-green-100 text-green-900",
    processing: "bg-blue-100 text-blue-900",
    packed: "bg-blue-100 text-blue-900",
    shipped: "bg-purple-100 text-purple-900",
    out_for_delivery: "bg-purple-100 text-purple-900",
    delivered: "bg-green-100 text-green-900",
    cancelled: "bg-red-100 text-red-900",
    returned: "bg-gray-100 text-gray-900",
  };

  const paymentColor: Record<string, string> = {
    pending: "text-yellow-700",
    paid: "text-green-700",
    failed: "text-red-700",
    cancelled: "text-gray-700",
    refunded: "text-blue-700",
  };

  return (
    <main className="mx-auto max-w-[1000px] px-4 py-10 sm:px-6">
      <Link href="/account/orders" className="text-sm underline">
        ← Back to orders
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-foreground/45">
            Order
          </p>
          <h1 className="display mt-2 text-4xl font-semibold">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            {new Date(order.createdAt).toLocaleString()} ·{" "}
            {order.items.length} item{order.items.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid gap-2 text-right">
          <span
            className={`rounded px-3 py-1 text-xs uppercase ${
              statusColor[order.status] || "bg-muted"
            }`}
          >
            {order.status.replace(/_/g, " ")}
          </span>
          <span
            className={`text-xs uppercase ${
              paymentColor[order.paymentStatus] || "text-foreground/60"
            }`}
          >
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Items */}
        <section>
          <h2 className="display text-2xl font-semibold">Items</h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item: any, index: number) => (
              <div
                key={index}
                className="flex flex-wrap items-center gap-4 border border-border p-4"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-xs text-foreground/50">
                    {item.color && `Color: ${item.color}`}
                    {item.size && ` · Size: ${item.size}`}
                  </p>
                </div>
                <p className="text-sm">
                  {item.qty} × ৳{item.unitPrice.toLocaleString()}
                </p>
                <p className="font-semibold">
                  ৳{(item.qty * item.unitPrice).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Subtotal</span>
                <span>৳{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Shipping</span>
                <span>৳{(order.shipping || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Discount</span>
                <span>-৳{(order.discount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Total</span>
                <span>৳{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="grid gap-6">
          <section className="border border-border p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Shipping address
            </h3>
            <div className="mt-3 text-sm leading-6">
              <p className="font-medium">{order.address.fullName}</p>
              <p>{order.address.phone}</p>
              <p className="mt-2">{order.address.line1}</p>
              {order.address.area && <p>{order.address.area}</p>}
              {order.address.city && (
                <p>
                  {order.address.city}, {order.address.district}
                </p>
              )}
              {order.address.postalCode && <p>{order.address.postalCode}</p>}
            </div>
          </section>

          <section className="border border-border p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Payment
            </h3>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Method</span>
                <span className="uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Status</span>
                <span className={`uppercase ${paymentColor[order.paymentStatus] || ""}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.sslcommerzTxnId && (
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-foreground/60">Txn ID</span>
                  <span className="truncate">{order.sslcommerzTxnId}</span>
                </div>
              )}
              {order.sslcommerzCardType && (
                <div className="flex justify-between">
                  <span className="text-foreground/60">Card</span>
                  <span className="uppercase">{order.sslcommerzCardType}</span>
                </div>
              )}
            </div>
          </section>

          {order.warrantyDays && (
            <section className="border border-border p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Warranty
              </h3>
              <div className="mt-3 text-sm">
                <p>{order.warrantyDays} days</p>
                {order.warrantyExpiresAt && (
                  <p className="mt-1 text-xs text-foreground/60">
                    Expires: {new Date(order.warrantyExpiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}