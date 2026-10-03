"use server";

import { randomUUID } from "node:crypto";
import { requireTechnician, requireUser } from "@/lib/rbac";
import { bookings, services, technicians, warranties } from "@/lib/mongodb";
import { canTransition, assignTechnician, issueQuotation, acceptQuotation, rejectQuotation, completeBooking } from "@/lib/booking";
import { createServiceWarranty } from "@/lib/warranty";
import type { Booking } from "@/types";
import { z } from "zod";

const bookingInput = z.object({ serviceSlug: z.string().min(1), address: z.string().min(5), phone: z.string().regex(/^01[3-9]\d{8}$/), scheduledAt: z.string().min(1), problemDescription: z.string().min(5), technicianId: z.string().optional(), mediaUrls: z.array(z.string()).max(4).default([]) });
const statusInput = z.object({ id: z.string(), status: z.enum(["accepted", "assigned", "on_the_way", "arrived", "started", "completed", "customer_confirmed", "closed", "cancelled"]) });
const quoteInput = z.object({ id: z.string(), amount: z.coerce.number().nonnegative(), notes: z.string().max(1000).default("") });
const idInput = z.object({ id: z.string() });
async function getOwnedBooking(id: string, owner: string, technician = false) {
  const booking = await (await bookings()).findOne({ id });
  if (!booking) throw new Error("Booking not found");
  if (technician) {
    const technicianRecord = await (await technicians()).findOne({ userId: owner });
    const technicianIds = technicianRecord ? [technicianRecord.id, technicianRecord._id.toString()] : [];
    if (!technicianIds.includes(booking.technicianId ?? "")) throw new Error("Booking not found");
  } else if (booking.customerId !== owner) {
    throw new Error("Booking not found");
  }
  return booking;
}
export async function createBookingAction(formData: FormData) {
  const session = await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = bookingInput.safeParse({ ...raw, mediaUrls: typeof raw.mediaUrls === "string" ? JSON.parse(raw.mediaUrls || "[]") : raw.mediaUrls });
  if (!parsed.success) return { error: "INVALID_INPUT" };
  const service = await (await services()).findOne({ slug: parsed.data.serviceSlug });
  if (!service) return { error: "SERVICE_NOT_FOUND" };
  const now = new Date().toISOString();
  const booking: Booking = { id: randomUUID(), bookingNumber: `HB-${Date.now().toString().slice(-8)}`, customerId: session.user.id, customerName: session.user.name ?? session.user.email, customerPhone: parsed.data.phone, serviceSlug: service.slug, serviceName: service.name, address: { id: randomUUID(), fullName: session.user.name ?? "", email: session.user.email, phone: parsed.data.phone, line1: parsed.data.address, area: "", city: "", district: "", division: "", postalCode: "", country: "BD" }, problemDescription: parsed.data.problemDescription, problemMediaUrls: parsed.data.mediaUrls, technicianId: null, status: "requested", scheduledAt: parsed.data.scheduledAt, visitFee: service.priceFrom, createdAt: now, updatedAt: now };
  const technicianCollection = await technicians();
  let assignment = null;
  if (parsed.data.technicianId) {
    const selected = await technicianCollection.findOne({ id: parsed.data.technicianId });
    if (!selected || !selected.active || !selected.verified || !selected.skills.some((skill) => skill.serviceSlug === service.slug)) return { error: "TECHNICIAN_SKILL_MISMATCH" };
    assignment = assignTechnician(booking, [selected]);
  } else {
    assignment = assignTechnician(booking, await technicianCollection.find({}).toArray());
  }
  if (assignment) Object.assign(booking, assignment);
  await (await bookings()).insertOne(booking);
  return { success: true, id: booking.id };
}
export async function acceptBookingAction(formData: FormData) {
  const session = await requireTechnician();
  const parsed = idInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "INVALID_INPUT" };
  const booking = await getOwnedBooking(parsed.data.id, session.user.id, true);
  if (!canTransition(booking.status, "accepted")) return { error: "INVALID_TRANSITION" };
  await (await bookings()).updateOne({ id: booking.id }, { $set: { status: "accepted", updatedAt: new Date().toISOString() } }); return { success: true };
}
export async function updateBookingStatusAction(formData: FormData) {
  const session = await requireTechnician();
  const parsed = statusInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "INVALID_INPUT" };
  const booking = await getOwnedBooking(parsed.data.id, session.user.id, true);
  if (!canTransition(booking.status, parsed.data.status)) return { error: "INVALID_TRANSITION" };
  await (await bookings()).updateOne({ id: booking.id }, { $set: { status: parsed.data.status, updatedAt: new Date().toISOString() } }); return { success: true };
}
export async function issueQuotationAction(formData: FormData) {
  const session = await requireTechnician(); const parsed = quoteInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "INVALID_INPUT" };
  const booking = await getOwnedBooking(parsed.data.id, session.user.id, true); await (await bookings()).updateOne({ id: booking.id }, { $set: issueQuotation(booking, parsed.data.amount, parsed.data.notes) }); return { success: true };
}
export async function acceptQuotationAction(formData: FormData) {
  const session = await requireUser(); const parsed = idInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "INVALID_INPUT" };
  const booking = await getOwnedBooking(parsed.data.id, session.user.id); await (await bookings()).updateOne({ id: booking.id }, { $set: acceptQuotation(booking) }); return { success: true };
}
export async function rejectQuotationAction(formData: FormData) {
  const session = await requireUser(); const parsed = idInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "INVALID_INPUT" };
  const booking = await getOwnedBooking(parsed.data.id, session.user.id); await (await bookings()).updateOne({ id: booking.id }, { $set: rejectQuotation(booking) }); return { success: true };
}
export async function completeBookingAction(formData: FormData) {
  const session = await requireTechnician(); const parsed = idInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "INVALID_INPUT" };
  const booking = await getOwnedBooking(parsed.data.id, session.user.id, true); const update = completeBooking(booking); const result = await (await bookings()).updateOne({ id: booking.id }, { $set: update }); if (result.modifiedCount) await (await warranties()).updateOne({ id: `warranty-${booking.bookingNumber}` }, { $set: createServiceWarranty(booking, 7) }, { upsert: true }); return { success: true };
}
