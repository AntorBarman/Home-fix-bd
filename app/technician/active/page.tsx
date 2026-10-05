import Link from "next/link";
import { requireTechnician } from "@/lib/rbac";
import { bookings, technicians } from "@/lib/mongodb";

export default async function ActiveJobsPage() {
  const session = await requireTechnician();
  const tech = await (await technicians()).findOne({
    userId: session.user.id as string,
  });

  if (!tech) {
    return (
      <div>
        <h1 className="display text-3xl font-semibold">Active jobs</h1>
        <p className="mt-4 text-sm text-foreground/60">
          Technician profile not found.
        </p>
      </div>
    );
  }

  const technicianIds = [tech._id.toString(), tech.id];

  const activeJobs = await (await bookings())
    .find({
      technicianId: { $in: technicianIds },
      status: { $in: ["accepted", "on_the_way", "arrived", "started"] },
    })
    .sort({ scheduledAt: 1 })
    .toArray();

  return (
    <div>
      <p className="text-xs uppercase tracking-[.2em] text-foreground/45">
        Technician · Active
      </p>
      <h1 className="display mt-2 text-3xl font-semibold">Active jobs</h1>
      <p className="mt-2 text-sm text-foreground/60">
        চলমান কাজের তালিকা। প্রতিটি কাজের detail দেখতে ক্লিক করুন।
      </p>

      <div className="mt-8 grid gap-3">
        {activeJobs.length ? (
          activeJobs.map((booking) => (
            <Link
              key={booking.id}
              href={`/technician/active/${booking.bookingNumber}`}
              className="grid gap-3 border border-border p-5 hover:bg-muted sm:grid-cols-[1fr_auto_auto]"
            >
              <div>
                <p className="font-semibold">{booking.bookingNumber}</p>
                <p className="mt-1 text-sm">{booking.serviceName}</p>
                <p className="mt-1 text-xs text-foreground/50">
                  {booking.customerName} · {booking.customerPhone}
                </p>
              </div>
              <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">
                {booking.status}
              </span>
              <span className="text-sm text-foreground/60">
                {new Date(booking.scheduledAt).toLocaleString()}
              </span>
            </Link>
          ))
        ) : (
          <div className="border border-border p-12 text-center">
            <p className="display text-2xl">কোনো active job নেই</p>
            <p className="mt-3 text-sm text-foreground/60">
              নতুন কাজ পেলে এখানে দেখা যাবে।
            </p>
            <Link
              href="/technician/requests"
              className="mt-6 inline-flex bg-foreground px-5 py-3 text-sm font-semibold text-background"
            >
              View requests
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}