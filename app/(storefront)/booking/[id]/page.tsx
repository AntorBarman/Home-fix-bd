import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { bookings } from "@/lib/mongodb";
import { Storefront } from "@/components/storefront";
import type { BookingStatus } from "@/types";

const steps: BookingStatus[] = ["requested", "accepted", "assigned", "on_the_way", "arrived", "started", "completed", "customer_confirmed", "closed"];
export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); const booking = await (await bookings()).findOne({ id: (await params).id }); if (!booking || !session?.user || booking.customerId !== session.user.id && booking.technicianId !== session.user.id) notFound();
  const current = steps.indexOf(booking.status);
  return <Storefront><main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><p className="text-xs uppercase tracking-[.2em] text-sale">{booking.bookingNumber}</p><h1 className="display mt-3 text-5xl font-semibold">{booking.serviceName}</h1><p className="mt-3 text-foreground/60">{booking.scheduledAt} · {booking.address.line1}</p><div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{steps.map((step, index) => <div key={step} className={`border p-3 text-sm ${index <= current ? "border-foreground bg-foreground text-background" : "border-border text-foreground/45"}`}>{step.replaceAll("_", " ")}</div>)}</div>{booking.technicianName && <p className="mt-8 border border-border p-5">Technician: <strong>{booking.technicianName}</strong></p>}{booking.quotation && <section className="mt-8 border border-border p-6"><h2 className="display text-2xl font-semibold">Quotation</h2><p className="mt-3">৳{booking.quotation.amount.toLocaleString()} · {booking.quotation.status}</p></section>}{booking.status === "completed" || booking.status === "customer_confirmed" || booking.status === "closed" ? <Link href={`/account/bookings/${booking.id}`} className="mt-8 inline-flex underline">View customer actions and warranty</Link> : null}</main></Storefront>;
}
