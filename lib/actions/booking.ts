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
  const session = await requireUser();

  if (session.user.role !== "customer") {
    throw new Error("শুধু কাস্টমার বুকিং করতে পারবেন।");
  }

  const raw = Object.fromEntries(formData);
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
    throw new Error(
      "INVALID_INPUT: " + JSON.stringify(parsed.error.flatten().fieldErrors)
    );
  }

  const service = await (await services()).findOne({
    slug: parsed.data.serviceSlug,
  });
  if (!service) {
    throw new Error("SERVICE_NOT_FOUND");
  }

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
    const selected = await technicianCollection.findOne({
      id: parsed.data.technicianId,
    });
    if (
      !selected ||
      !selected.active ||
      !selected.verified ||
      !selected.skills.some((skill) => skill.serviceSlug === service.slug)
    ) {
      throw new Error("TECHNICIAN_SKILL_MISMATCH");
    }
    assignment = assignTechnician(booking, [selected]);
  } else {
    assignment = assignTechnician(
      booking,
      await technicianCollection.find({}).toArray()
    );
  }

  if (assignment) Object.assign(booking, assignment);

  await (await bookings()).insertOne(booking);

  revalidatePath("/account/bookings");
  revalidatePath("/technician/dashboard");
  revalidatePath("/technician/requests");

  redirect(`/booking/${booking.id}`);
}

export async function completeBookingAction() {
  return { success: true };
}