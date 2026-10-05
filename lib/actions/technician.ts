"use server";

import { revalidatePath } from "next/cache";
import { requireTechnician } from "@/lib/rbac";
import { technicians, bookings, warranties } from "@/lib/mongodb";
import { technicianProfileSchema } from "@/lib/schemas/technician";
import { canTransition, completeBooking, assignTechnician } from "@/lib/booking";
import { createServiceWarranty } from "@/lib/warranty";
import { z } from "zod";

type ActionResult = { success?: boolean; error?: string };

// ─── Update technician profile ──────────────────────────
export async function updateProfileAction(formData: FormData) {
  const session = await requireTechnician();
  const userId = session.user.id;
  const raw = Object.fromEntries(formData);

  let input: unknown;
  try {
    input = {
      ...raw,
      skills: JSON.parse(String(raw.skills || "[]")),
      serviceAreas: JSON.parse(String(raw.serviceAreas || "[]")),
      availability: JSON.parse(String(raw.availability || "[]")),
    };
  } catch {
    return { error: "Invalid profile data." };
  }

  const parsed = technicianProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Please check your profile details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const status =
    data.nidNumber && data.skills.length > 0 && data.serviceAreas.length > 0
      ? "under_review"
      : undefined;

  await (await technicians()).updateOne(
    { userId },
    {
      $set: {
        ...data,
        ...(status ? { verificationStatus: status } : {}),
        updatedAt: new Date().toISOString(),
      },
    }
  );

  revalidatePath("/technician/profile");
  return { success: true };
}

// ─── Schemas ────────────────────────────────────────────
const bookingNumberSchema = z.object({
  bookingNumber: z.string().min(1),
});

const statusSchema = bookingNumberSchema.extend({
  nextStatus: z.enum([
    "accepted",
    "assigned",
    "on_the_way",
    "arrived",
    "started",
    "completed",
    "customer_confirmed",
    "closed",
    "cancelled",
  ]),
});

const quotationSchema = bookingNumberSchema.extend({
  visitFee: z.coerce.number().nonnegative(),
  labour: z.coerce.number().nonnegative(),
  parts: z.string(),
  notes: z.string().max(2000).default(""),
});

const availabilitySchema = z.object({ availability: z.string() });
const areasSchema = z.object({ serviceAreas: z.string() });

// ─── Helper: Get technician context ─────────────────────
async function technicianContext() {
  const session = await requireTechnician();
  const technician = await (await technicians()).findOne({
    userId: session.user.id,
  });
  if (!technician) throw new Error("Technician profile not found");
  const ids = [technician.id, technician._id.toString()].filter(
    Boolean
  ) as string[];
  return { session, technician, ids };
}

async function ownedBooking(bookingNumber: string, ids: string[]) {
  const booking = await (await bookings()).findOne({
    bookingNumber,
    technicianId: { $in: ids },
  });
  if (!booking) throw new Error("Booking not found");
  return booking;
}

function revalidateTechnician(bookingNumber: string) {
  revalidatePath("/technician/dashboard");
  revalidatePath("/technician/requests");
  revalidatePath("/technician/active");
  revalidatePath(`/technician/active/${bookingNumber}`);
  revalidatePath("/technician/completed");
  revalidatePath("/technician/earnings");
  // ✅ Auto-reassign হলে admin এবং customer dashboard-ও update দরকার
  revalidatePath("/admin/bookings");
  revalidatePath("/account/bookings");
}

// ─── Accept booking ─────────────────────────────────────
export async function acceptBookingAction(
  formData: FormData
): Promise<ActionResult> {
  const { technician, ids } = await technicianContext();

  const parsed = bookingNumberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid booking." };

  const col = await bookings();
  const booking = await col.findOne({
    bookingNumber: parsed.data.bookingNumber,
  });
  if (!booking) return { error: "Booking not found." };

  const status = String(booking.status).trim();
  const now = new Date().toISOString();
  const techId = technician._id.toString();

  console.log("[accept]", {
    raw: JSON.stringify(booking.status),
    technicianId: booking.technicianId,
  });

  // কেস ১: আমাকে assign করা job
  if (booking.technicianId && ids.includes(String(booking.technicianId))) {
    if (status !== "assigned" && status !== "requested") {
      return { error: "This booking cannot be accepted now." };
    }
    await col.updateOne(
      { bookingNumber: booking.bookingNumber },
      { $set: { status: "accepted", updatedAt: now } }
    );
    revalidateTechnician(booking.bookingNumber);
    return { success: true };
  }

  // কেস ২: কেউ নেয়নি এমন open job → atomic claim
  if (!booking.technicianId && status === "requested") {
    const skillMatch = (technician.skills ?? []).some(
      (s: { serviceSlug: string }) => s.serviceSlug === booking.serviceSlug
    );
    if (!skillMatch) return { error: "This job does not match your skills." };

    const res = await col.updateOne(
      {
        bookingNumber: booking.bookingNumber,
        technicianId: null,
        status: "requested",
      } as never,
      {
        $set: {
          technicianId: techId,
          technicianName: technician.name,
          status: "accepted",
          updatedAt: now,
        },
      }
    );
    if (res.matchedCount === 0) {
      return { error: "Another technician already took this job." };
    }
    revalidateTechnician(booking.bookingNumber);
    return { success: true };
  }

  return { error: "This booking cannot be accepted now." };
}

// ─── Reject booking (WITH AUTO-REASSIGN) ────────────────
export async function rejectBookingAction(
  formData: FormData
): Promise<ActionResult> {
  const { technician, ids } = await technicianContext();

  const parsed = bookingNumberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid booking." };

  const col = await bookings();
  const booking = await col.findOne({
    bookingNumber: parsed.data.bookingNumber,
  });
  if (!booking) return { error: "Booking not found." };

  const status = String(booking.status).trim();
  const now = new Date().toISOString();
  const techId = technician._id.toString();

  if (booking.technicianId && ids.includes(String(booking.technicianId))) {
    // ✅ কেস ১: আমাকে assign করা job → ছেড়ে দিই
    if (status !== "assigned" && status !== "requested") {
      return { error: "This booking cannot be rejected now." };
    }

    // Step 1: Update booking with rejectedBy
    await col.updateOne(
      { bookingNumber: booking.bookingNumber },
      {
        $set: {
          status: "requested",
          technicianId: null,
          updatedAt: now,
        },
        $unset: { technicianName: "" },
        $addToSet: { rejectedBy: techId },
      } as never
    );

    // Step 2: Auto-reassign to another eligible technician
    console.log("[reject] attempting auto-reassign for:", booking.bookingNumber);

    const allTechs = await (await technicians()).find({}).toArray();
    const alreadyRejected = [
      ...(booking.rejectedBy ?? []),
      techId,
    ];

    const eligible = allTechs.filter(
      (t) =>
        t.active === true &&
        t.verified === true &&
        !alreadyRejected.includes(t._id.toString()) &&
        t.id !== techId &&
        Array.isArray(t.skills) &&
        t.skills.some((s: any) => s.serviceSlug === booking.serviceSlug)
    );

    console.log("[reject] eligible candidates:", eligible.length);

    if (eligible.length > 0) {
      const reassigned = assignTechnician(booking, eligible);
      if (reassigned) {
        await col.updateOne(
          { bookingNumber: booking.bookingNumber },
          { $set: reassigned }
        );
        console.log(
          "[reject] auto-reassigned to:",
          reassigned.technicianName,
          "id:",
          reassigned.technicianId
        );
      }
    } else {
      console.log("[reject] no other technician available — booking stays requested");
    }
  } else if (!booking.technicianId && status === "requested") {
    // ✅ কেস ২: open job → শুধু আমার তালিকা থেকে লুকাই
    await col.updateOne(
      { bookingNumber: booking.bookingNumber },
      { $addToSet: { rejectedBy: techId } } as never
    );
  } else {
    return { error: "This booking cannot be rejected now." };
  }

  revalidateTechnician(booking.bookingNumber);
  return { success: true };
}

// ─── Update booking status ─────────────────────────────
export async function updateBookingStatusAction(formData: FormData) {
  const { ids } = await technicianContext();

  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid status update." };

  const booking = await ownedBooking(parsed.data.bookingNumber, ids);

  if (!canTransition(booking.status, parsed.data.nextStatus)) {
    return { error: "Invalid status transition." };
  }

  await (await bookings()).updateOne(
    { bookingNumber: booking.bookingNumber },
    {
      $set: {
        status: parsed.data.nextStatus,
        updatedAt: new Date().toISOString(),
      },
    }
  );

  revalidateTechnician(booking.bookingNumber);
  return { success: true };
}

// ─── Issue quotation ───────────────────────────────────
export async function issueQuotationAction(formData: FormData) {
  const { ids } = await technicianContext();

  const parsed = quotationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the quotation." };

  const booking = await ownedBooking(parsed.data.bookingNumber, ids);

  if (!["arrived", "started"].includes(booking.status)) {
    return { error: "Quotation is only available after arrival." };
  }

  let parts: { name: string; price: number }[];
  try {
    parts = z
      .array(
        z.object({
          name: z.string().min(1),
          price: z.coerce.number().nonnegative(),
        })
      )
      .parse(JSON.parse(parsed.data.parts));
  } catch {
    return { error: "Invalid parts list." };
  }

  const total =
    parsed.data.visitFee +
    parsed.data.labour +
    parts.reduce((sum, part) => sum + Number(part.price), 0);

  await (await bookings()).updateOne(
    { bookingNumber: booking.bookingNumber },
    {
      $set: {
        quotation: {
          visitFee: parsed.data.visitFee,
          labour: parsed.data.labour,
          parts,
          total,
          amount: total,
          notes: parsed.data.notes,
          issuedAt: new Date().toISOString(),
          status: "pending",
        },
        updatedAt: new Date().toISOString(),
      },
    }
  );

  revalidateTechnician(booking.bookingNumber);
  return { success: true };
}

// ─── Complete booking ───────────────────────────────────
export async function completeBookingAction(formData: FormData) {
  const { ids } = await technicianContext();

  const parsed = bookingNumberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid booking." };

  const booking = await ownedBooking(parsed.data.bookingNumber, ids);

  if (!canTransition(booking.status, "completed")) {
    return { error: "Booking is not ready to complete." };
  }

  if (booking.quotation?.status !== "accepted") {
    return { error: "The customer must accept the quotation first." };
  }

  const update = completeBooking(booking);
  const result = await (await bookings()).updateOne(
    { bookingNumber: booking.bookingNumber },
    { $set: update }
  );

  if (result.modifiedCount) {
    await (await warranties()).updateOne(
      { id: `warranty-${booking.bookingNumber}` },
      { $set: createServiceWarranty(booking, 7) },
      { upsert: true }
    );
  }

  revalidateTechnician(booking.bookingNumber);
  return { success: true };
}

// ─── Update availability ────────────────────────────────
export async function updateAvailabilityAction(formData: FormData) {
  const { technician } = await technicianContext();

  const parsed = availabilitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid availability." };

  let availability;
  try {
    availability = JSON.parse(parsed.data.availability);
  } catch {
    return { error: "Invalid availability." };
  }

  await (await technicians()).updateOne(
    { _id: technician._id },
    { $set: { availability, updatedAt: new Date().toISOString() } }
  );

  revalidatePath("/technician/availability");
  return { success: true };
}

// ─── Update service areas ───────────────────────────────
export async function updateAreasAction(formData: FormData) {
  const { technician } = await technicianContext();

  const parsed = areasSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid service areas." };

  let serviceAreas;
  try {
    serviceAreas = JSON.parse(parsed.data.serviceAreas);
  } catch {
    return { error: "Invalid service areas." };
  }

  await (await technicians()).updateOne(
    { _id: technician._id },
    { $set: { serviceAreas, updatedAt: new Date().toISOString() } }
  );

  revalidatePath("/technician/areas");
  return { success: true };
}