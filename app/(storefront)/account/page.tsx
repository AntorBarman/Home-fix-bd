import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { orders, bookings, warranties } from "@/lib/mongodb";

export default async function AccountPage() {
  const session = await requireUser();
  const userId = session.user.id as string;

  // Load customer's data in parallel
  const [myOrders, myBookings, myWarranties] = await Promise.all([
    (await orders()).find({ userId }).sort({ createdAt: -1 }).limit(5).toArray(),
    (await bookings()).find({ customerId: userId }).sort({ createdAt: -1 }).limit(5).toArray(),
    (await warranties()).find({}).toArray(),
  ]);

  const totalSpent = myOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeBookings = myBookings.filter(
    (b) => !["closed", "cancelled"].includes(b.status)
  ).length;
  const activeWarranties = myWarranties.filter((w) => {
    const end = new Date(w.endDate);
    return end > new Date();
  }).length;

  const firstName = session.user.name?.split(" ")[0] || "Guest";

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-[.2em] text-foreground/45">
        HomeFix BD · Account
      </p>
      <h1 className="display mt-2 text-4xl font-semibold">
        স্বাগতম, {firstName}
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        আপনার অর্ডার, বুকিং, ঠিকানা ও ওয়ারেন্টি এক জায়গায়।
      </p>

      {/* KPI Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-muted p-5">
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Orders / অর্ডার
          </p>
          <p className="display mt-2 text-3xl font-semibold">{myOrders.length}</p>
        </div>
        <div className="border border-border bg-muted p-5">
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Active bookings / সক্রিয় বুকিং
          </p>
          <p className="display mt-2 text-3xl font-semibold">{activeBookings}</p>
        </div>
        <div className="border border-border bg-muted p-5">
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Total spent / মোট খরচ
          </p>
          <p className="display mt-2 text-3xl font-semibold">
            ৳{totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="border border-border bg-muted p-5">
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Warranties / ওয়ারেন্টি
          </p>
          <p className="display mt-2 text-3xl font-semibold">
            {activeWarranties}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="bg-foreground px-5 py-3 text-sm font-semibold text-background"
        >
          View all orders
        </Link>
        <Link
          href="/account/bookings"
          className="border border-foreground px-5 py-3 text-sm font-semibold"
        >
          View bookings
        </Link>
        <Link
          href="/account/warranty"
          className="border border-border px-5 py-3 text-sm font-semibold"
        >
          Warranty / ওয়ারেন্টি
        </Link>
        <Link
          href="/account/support"
          className="border border-border px-5 py-3 text-sm font-semibold"
        >
          Support / সাপোর্ট
        </Link>
      </div>

      {/* Recent orders */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="display text-2xl font-semibold">
            Recent orders / সাম্প্রতিক অর্ডার
          </h2>
          <Link
            href="/account/orders"
            className="text-sm text-foreground/60 underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {myOrders.length ? (
            myOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between gap-3 border border-border p-4 text-sm hover:bg-muted"
              >
                <span className="font-medium">{order.orderNumber}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">
                  {order.status}
                </span>
                <span>৳{(order.total || 0).toLocaleString()}</span>
                <span className="text-xs text-foreground/50">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))
          ) : (
            <div className="border border-border p-6 text-center text-sm text-foreground/60">
              No orders yet / কোনো অর্ডার নেই
            </div>
          )}
        </div>
      </section>

      {/* Recent bookings */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="display text-2xl font-semibold">
            Recent bookings / সাম্প্রতিক বুকিং
          </h2>
          <Link
            href="/account/bookings"
            className="text-sm text-foreground/60 underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {myBookings.length ? (
            myBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/account/bookings/${booking.id}`}
                className="flex items-center justify-between gap-3 border border-border p-4 text-sm hover:bg-muted"
              >
                <span className="font-medium">{booking.bookingNumber}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">
                  {booking.status}
                </span>
                <span>{booking.serviceName}</span>
                <span className="text-xs text-foreground/50">
                  {new Date(booking.scheduledAt).toLocaleDateString()}
                </span>
              </Link>
            ))
          ) : (
            <div className="border border-border p-6 text-center text-sm text-foreground/60">
              No bookings yet / কোনো বুকিং নেই
            </div>
          )}
        </div>
      </section>

      {/* Explore CTAs */}
      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        <Link
          href="/shop"
          className="block border border-border p-8 transition hover:-translate-y-1 hover:border-foreground"
        >
          <h3 className="display text-2xl font-semibold">Browse products</h3>
          <p className="mt-2 text-sm text-foreground/60">
            আপনার ঘরের প্রয়োজনীয় পণ্য খুঁজুন।
          </p>
        </Link>
        <Link
          href="/services"
          className="block border border-border p-8 transition hover:-translate-y-1 hover:border-foreground"
        >
          <h3 className="display text-2xl font-semibold">Explore services</h3>
          <p className="mt-2 text-sm text-foreground/60">
            ভেরিফাইড মিস্ত্রি বুক করুন যেকোনো সময়।
          </p>
        </Link>
      </section>
    </main>
  );
}