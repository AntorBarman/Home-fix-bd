import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTechnician } from "@/lib/rbac";
import { bookings, technicians } from "@/lib/mongodb";

export default async function ActiveJobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTechnician();
  const { id } = await params;

  const tech = await (await technicians()).findOne({
    userId: session.user.id as string,
  });
  if (!tech) notFound();

  const technicianIds = [tech._id.toString(), tech.id];

  // Try to find booking assigned to this technician
  const booking = await (await bookings()).findOne({
    $or: [{ bookingNumber: id }, { id }],
    technicianId: { $in: technicianIds },
  });

  // If not found, check if booking exists at all (for better error message)
  if (!booking) {
    const anyBooking = await (await bookings()).findOne({
      $or: [{ bookingNumber: id }, { id }],
    });

    if (anyBooking) {
      // Booking exists but not assigned to this technician
      return (
        <div>
          <Link href="/technician/active" className="text-sm underline">
            ← Back to active jobs
          </Link>

          <p className="mt-6 text-xs uppercase tracking-wider text-sale">
            Access restricted
          </p>
          <h1 className="display mt-2 text-3xl font-semibold">
            এই booking আপনার অধীনে নেই
          </h1>

          <div className="mt-6 border border-yellow-300 bg-yellow-50 p-5 text-sm text-yellow-900">
            <p>
              <strong>{anyBooking.bookingNumber}</strong> booking হয়তো অন্য
              technician-কে assign করা হয়েছে, অথবা এখনো কোনো technician-কে
              assign হয়নি।
            </p>
            <p className="mt-2 text-xs">
              Current Status: <strong>{anyBooking.status}</strong>
            </p>
            <p className="mt-1 text-xs">
              Service: <strong>{anyBooking.serviceName}</strong>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/technician/requests"
              className="bg-foreground px-5 py-3 text-sm font-semibold text-background"
            >
              View available requests
            </Link>
            <Link
              href="/technician/dashboard"
              className="border border-border px-5 py-3 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      );
    }

    // Booking doesn't exist at all
    notFound();
  }

  // Booking found and owned by this technician
  const steps = [
    "assigned",
    "accepted",
    "on_the_way",
    "arrived",
    "started",
    "completed",
    "customer_confirmed",
    "closed",
  ];
  const currentIndex = steps.indexOf(booking.status);

  return (
    <div>
      <Link href="/technician/active" className="text-sm underline">
        ← Back to active jobs
      </Link>

      <p className="mt-4 text-xs uppercase tracking-[.2em] text-foreground/45">
        Technician · Active
      </p>
      <h1 className="display mt-2 text-3xl font-semibold">
        {booking.serviceName}
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        {booking.bookingNumber} · {booking.customerName}
      </p>

      {/* Status timeline */}
      <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`border p-3 text-xs uppercase ${
              i < currentIndex
                ? "border-foreground/30 bg-muted text-foreground/60"
                : i === currentIndex
                  ? "border-foreground bg-foreground text-background font-semibold"
                  : "border-border text-foreground/40"
            }`}
          >
            {step.replace(/_/g, " ")}
          </div>
        ))}
      </div>

      {/* Customer info */}
      <div className="mt-8 grid gap-4 border border-border p-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Customer
          </p>
          <p className="mt-1 font-medium">{booking.customerName}</p>
          <a
            href={`tel:${booking.customerPhone}`}
            className="text-sm text-foreground/60 underline"
          >
            {booking.customerPhone}
          </a>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Address
          </p>
          <p className="mt-1 text-sm">{booking.address.line1}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Problem
          </p>
          <p className="mt-1 text-sm">{booking.problemDescription}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Scheduled
          </p>
          <p className="mt-1 text-sm">
            {new Date(booking.scheduledAt).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            Visit fee
          </p>
          <p className="mt-1 text-sm">৳{booking.visitFee}</p>
        </div>
      </div>
    </div>
  );
}