"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { bookings, services, technicians } from "@/lib/mongodb";
import { assignTechnician } from "@/lib/booking";
import type { Booking } from "@/types";
import { z } from "zod";

const bookingInput = z.object({
  serviceSlug: z.string().min(1),
  address: z.string().min(5),
  phone: z.string().regex(/^01[3-9]\d{8}$/),
  scheduledAt: z.string().min(1),
  problemDescription: z.string().min(5),
  technicianId: z.string().optional().or(z.literal("")),
  mediaUrls: z.array(z.string()).max(4).default([]),
});

export async function createBookingAction(formData: FormData) {
  console.log("[booking] === START ===");

  let session;
  try {
    session = await requireUser();
  } catch (err) {
    console.log("[booking] FAIL: requireUser threw:", err);
    return { error: "UNAUTHENTICATED" };
  }

  console.log("[booking] session:", {
    id: session?.user?.id,
    email: session?.user?.email,
    role: session?.user?.role,
  });

  if (session.user.role !== "customer") {
    console.log("[booking] FAIL: not a customer");
    return { error: "শুধু কাস্টমার বুকিং করতে পারবেন।" };
  }

  const raw = Object.fromEntries(formData);
  console.log("[booking] raw formData:", raw);

  // Parse mediaUrls safely
  let mediaUrls: string[] = [];
  if (typeof raw.mediaUrls === "string" && raw.mediaUrls.trim()) {
    try {
      mediaUrls = JSON.parse(raw.mediaUrls);
    } catch {
      mediaUrls = [];
    }
  }

  const parsed = bookingInput.safeParse({
    ...raw,
    mediaUrls,
  });

  if (!parsed.success) {
    console.log("[booking] FAIL: safeParse errors:", parsed.error.flatten());
    return { error: "INVALID_INPUT" };
  }

  console.log("[booking] parsed OK:", parsed.data);

  const service = await (await services()).findOne({
    slug: parsed.data.serviceSlug,
  });

  if (!service) {
    console.log("[booking] FAIL: service not found:", parsed.data.serviceSlug);
    return { error: "SERVICE_NOT_FOUND" };
  }

  console.log("[booking] service found:", service.slug, service.name);

  const now = new Date().toISOString();
  const booking: Booking = {
    id: randomUUID(),
    bookingNumber: `HB-${Date.now().toString().slice(-8)}`,
    customerId: session.user.id,
    customerName: session.user.name ?? session.user.email,
    customerPhone: parsed.data.phone,
    serviceSlug: service.slug,
    serviceName: service.name,
    address: {
      id: randomUUID(),
      fullName: session.user.name ?? "",
      email: session.user.email,
      phone: parsed.data.phone,
      line1: parsed.data.address,
      area: "",
      city: "",
      district: "",
      division: "",
      postalCode: "",
      country: "BD",
    },
    problemDescription: parsed.data.problemDescription,
    problemMediaUrls: parsed.data.mediaUrls,
    technicianId: null,
    status: "requested",
    scheduledAt: parsed.data.scheduledAt,
    visitFee: service.priceFrom,
    createdAt: now,
    updatedAt: now,
  };

  const technicianCollection = await technicians();
  let assignment = null;

  if (parsed.data.technicianId) {
    console.log("[booking] manual technician:", parsed.data.technicianId);
    const selected = await technicianCollection.findOne({
      id: parsed.data.technicianId,
    });
    if (
      !selected ||
      !selected.active ||
      !selected.verified ||
      !selected.skills.some((skill) => skill.serviceSlug === service.slug)
    ) {
      console.log("[booking] FAIL: technician skill mismatch");
      return { error: "TECHNICIAN_SKILL_MISMATCH" };
    }
    assignment = assignTechnician(booking, [selected]);
  } else {
    console.log("[booking] auto-assign technician");
    assignment = assignTechnician(
      booking,
      await technicianCollection.find({}).toArray()
    );
  }

  if (assignment) {
    Object.assign(booking, assignment);
    console.log("[booking] assigned:", booking.technicianName);
  } else {
    console.log("[booking] no technician assigned — booking left as requested");
  }

  console.log("[booking] inserting booking:", booking.bookingNumber);
  const result = await (await bookings()).insertOne(booking);
  console.log("[booking] INSERTED:", result.insertedId.toString());

  revalidatePath("/account/bookings");
  revalidatePath("/technician/dashboard");
  revalidatePath("/technician/requests");

  console.log("[booking] redirecting to:", `/booking/${booking.id}`);
  redirect(`/booking/${booking.id}`);
}

// ✅ Placeholder for backwards compatibility
export async function completeBookingAction() {
  return { success: true };
}