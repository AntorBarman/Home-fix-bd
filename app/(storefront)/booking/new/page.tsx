import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Storefront } from "@/components/storefront";
import { loadCatalog } from "@/lib/catalog";
import { createBookingAction } from "@/lib/actions/booking";
import { technicians } from "@/lib/mongodb";
import type { Technician } from "@/types";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function NewBooking({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; technician?: string }>;
}) {
  // ─── 1. Session check ───────────────────────────────
  const session = await auth();

  // Not signed in → sign in page
  if (!session?.user) {
    redirect("/signin?callbackUrl=/booking/new");
  }

  // ─── 2. Role guard: only customers ─────────────────
  if (session.user.role !== "customer") {
    const roleLabel: Record<string, string> = {
      technician: "Technician / টেকনিশিয়ান",
      seller: "Seller / বিক্রেতা",
      admin: "Admin / অ্যাডমিন",
    };

    return (
      <Storefront>
        <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <span className="text-6xl">🔒</span>

          <p className="mt-8 text-xs uppercase tracking-[.2em] text-sale">
            Access restricted
          </p>

          <h1 className="display mt-3 text-4xl font-semibold">
            বুকিং শুধু কাস্টমার অ্যাকাউন্টের জন্য
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-foreground/60">
            আপনি এখন{" "}
            <strong className="text-foreground">
              {roleLabel[session.user.role] ?? session.user.role}
            </strong>{" "}
            হিসেবে লগইন করেছেন। Technician, Seller এবং Admin অ্যাকাউন্ট
            দিয়ে technician বুকিং করা যায় না।
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="bg-foreground px-6 py-3 text-sm font-semibold text-background"
            >
              নতুন কাস্টমার অ্যাকাউন্ট তৈরি করুন
            </Link>

            {session.user.role === "technician" && (
              <Link
                href="/technician/dashboard"
                className="border border-foreground px-6 py-3 text-sm font-semibold"
              >
                আমার Technician Dashboard
              </Link>
            )}

            {session.user.role === "seller" && (
              <Link
                href="/seller/dashboard"
                className="border border-foreground px-6 py-3 text-sm font-semibold"
              >
                আমার Seller Dashboard
              </Link>
            )}

            {session.user.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className="border border-foreground px-6 py-3 text-sm font-semibold"
              >
                Admin Dashboard
              </Link>
            )}

            <Link
              href="/"
              className="border border-border px-6 py-3 text-sm"
            >
              হোম পেজে ফিরে যান
            </Link>
          </div>

          <div className="mt-12 border-t border-border pt-6 text-xs text-foreground/50">
            এই restriction একটি security feature — যাতে technician নিজে নিজে
            কাজ book করতে না পারে।
          </div>
        </main>
      </Storefront>
    );
  }

  // ─── 3. Only customers reach here ──────────────────
  const params = await searchParams;
  const catalog = await loadCatalog();

  let techs: Technician[] = [];
  try {
    techs = await (await technicians())
      .find({ active: true })
      .limit(20)
      .toArray();
  } catch {
    techs = [];
  }

  return (
    <Storefront>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[.2em] text-sale">
          Book a technician
        </p>
        <h1 className="display mt-3 text-5xl font-semibold">
          আপনার সমস্যার সমাধান শুরু হোক
        </h1>

        <form action={createBookingAction} className="mt-10 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold">
            1. Service
            <select
              name="serviceSlug"
              defaultValue={params.service ?? ""}
              required
              className="min-h-11 border border-border px-3"
            >
              {catalog.services.map((service) => (
                <option value={service.slug} key={service.slug}>
                  {service.nameBn} — ৳{service.priceFrom} থেকে
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            2. Address
            <input
              name="address"
              required
              className="min-h-11 border border-border px-3"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            3. Phone
            <input
              name="phone"
              required
              pattern="01[3-9][0-9]{8}"
              placeholder="017XXXXXXXX"
              className="min-h-11 border border-border px-3"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            4. Date and time
            <input
              name="scheduledAt"
              type="datetime-local"
              required
              className="min-h-11 border border-border px-3"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            5. Describe the problem
            <textarea
              name="problemDescription"
              required
              minLength={5}
              className="min-h-32 border border-border p-3"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            6. Technician
            <select
              name="technicianId"
              defaultValue={params.technician ?? ""}
              className="min-h-11 border border-border px-3"
            >
              <option value="">
                Auto-assign the best available technician
              </option>
              {techs.map((tech) => (
                <option value={tech.id} key={tech.id}>
                  {tech.name} · {tech.rating} ★ · ৳{tech.visitCharge}
                </option>
              ))}
            </select>
          </label>

          <input type="hidden" name="mediaUrls" value="[]" />

          <SubmitButton pendingText="Booking...">
            Confirm booking
          </SubmitButton>
        </form>
      </main>
    </Storefront>
  );
}