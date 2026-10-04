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
  const params = await searchParams;
  const catalog = await loadCatalog();

  let techs: Technician[] = [];
  try {
    techs = await (await technicians()).find({ active: true }).limit(20).toArray();
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

        {/* ✅ Direct server action reference — no wrapper */}
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
              <option value="">Auto-assign the best available technician</option>
              {techs.map((tech) => (
                <option value={tech.id} key={tech.id}>
                  {tech.name} · {tech.rating} ★ · ৳{tech.visitCharge}
                </option>
              ))}
            </select>
          </label>

          <input type="hidden" name="mediaUrls" value="[]" />

          <SubmitButton pendingText="Booking...">Confirm booking</SubmitButton>
        </form>
      </main>
    </Storefront>
  );
}