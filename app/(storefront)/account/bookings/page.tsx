import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { bookings } from "@/lib/mongodb";

export default async function BookingsPage() {
  const session = await requireUser();

  const myBookings = await (await bookings())
    .find({ customerId: session.user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-[.2em] text-foreground/45">
        HomeFix BD · Account / Bookings
      </p>
      <h1 className="display mt-2 text-4xl font-semibold">আমার বুকিং</h1>
      <p className="mt-2 text-sm text-foreground/60">
        সব সার্ভিস বুকিং ও টেকনিশিয়ানের তথ্য।
      </p>

      <div className="mt-8 grid gap-3">
        {myBookings.length ? (
          myBookings.map((booking) => {
            const isWaiting = booking.status === "requested";
            const wasRejected =
              Array.isArray(booking.rejectedBy) &&
              booking.rejectedBy.length > 0;

            return (
              <Link
                key={booking.id}
                href={`/account/bookings/${booking.id}`}
                className="grid gap-3 border border-border p-5 hover:bg-muted sm:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <p className="font-semibold">{booking.serviceName}</p>
                  <p className="mt-1 text-xs text-foreground/50">
                    {booking.bookingNumber} ·{" "}
                    {new Date(booking.scheduledAt).toLocaleString()}
                  </p>

                  {/* ✅ Status explanation */}
                  {isWaiting && wasRejected && (
                    <p className="mt-2 text-xs text-yellow-700">
                      ⏳ টেকনিশিয়ান এখনো accept করেননি। আমরা অন্য
                      টেকনিশিয়ান খুঁজছি।
                    </p>
                  )}
                  {isWaiting && !wasRejected && (
                    <p className="mt-2 text-xs text-foreground/50">
                      ⏳ টেকনিশিয়ান assignment-এর অপেক্ষায়।
                    </p>
                  )}
                  {booking.status === "assigned" && (
                    <p className="mt-2 text-xs text-blue-700">
                      ✅ টেকনিশিয়ান assign হয়েছে। শীঘ্রই accept করবে।
                    </p>
                  )}
                  {booking.status === "accepted" && (
                    <p className="mt-2 text-xs text-green-700">
                      ✅ টেকনিশিয়ান accept করেছে।
                    </p>
                  )}
                </div>

                <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">
                  {booking.status}
                </span>

                <span className="font-semibold">
                  ৳{(booking.visitFee || 0).toLocaleString()}
                </span>
              </Link>
            );
          })
        ) : (
          <div className="border border-border p-12 text-center">
            <p className="display text-2xl">এখনো কোনো বুকিং নেই</p>
            <Link
              href="/technicians"
              className="mt-6 inline-flex bg-foreground px-5 py-3 text-sm font-semibold text-background"
            >
              Browse technicians
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}