"use server";

import { revalidatePath } from "next/cache";
import { requireTechnician } from "@/lib/rbac";
import { technicians } from "@/lib/mongodb";
import { bookings, warranties } from "@/lib/mongodb";
import { technicianProfileSchema } from "@/lib/schemas/technician";
import { canTransition } from "@/lib/booking";
import { createServiceWarranty } from "@/lib/warranty";
import { z } from "zod";

export async function updateProfileAction(formData: FormData) {
  const session = await requireTechnician();
  const userId = session.user.id;
  const raw = Object.fromEntries(formData);
  let input: unknown;
  try { input = { ...raw, skills: JSON.parse(String(raw.skills || "[]")), serviceAreas: JSON.parse(String(raw.serviceAreas || "[]")), availability: JSON.parse(String(raw.availability || "[]")) }; } catch { return { error: "Invalid profile data." }; }
  const parsed = technicianProfileSchema.safeParse(input);
  console.log("[tech-profile] safeParse result:", parsed.success, parsed.success ? undefined : parsed.error.flatten());
  if (!parsed.success) return { error: "Please check your profile details.", fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  const status = data.nidNumber && data.skills.length > 0 && data.serviceAreas.length > 0 ? "under_review" : undefined;
  console.log("[tech-profile] incoming:", data);
  console.log("[tech-profile] updating userId:", userId);
  const result = await (await technicians()).updateOne({ userId }, { $set: { ...data, ...(status ? { verificationStatus: status } : {}), updatedAt: new Date().toISOString() } });
  console.log("[tech-profile] result:", result.modifiedCount);
  revalidatePath("/technician/profile");
  return { success: true };
}

const bookingNumberSchema = z.object({ bookingNumber: z.string().min(1) });
const statusSchema = bookingNumberSchema.extend({ nextStatus: z.enum(["accepted", "assigned", "on_the_way", "arrived", "started", "completed", "cancelled"]) });
const quotationSchema = bookingNumberSchema.extend({ visitFee: z.coerce.number().nonnegative(), labour: z.coerce.number().nonnegative(), parts: z.string(), notes: z.string().max(2000).default("") });
const availabilitySchema = z.object({ availability: z.string() });
const areasSchema = z.object({ serviceAreas: z.string() });

async function technicianContext() {
  const session = await requireTechnician();
  const technician = await (await technicians()).findOne({ userId: session.user.id });
  if (!technician) throw new Error("Technician profile not found");
  const ids = [technician.id, technician._id.toString()];
  return { session, technician, ids };
}

async function ownedBooking(bookingNumber: string, ids: string[]) {
  const booking = await (await bookings()).findOne({ bookingNumber, technicianId: { $in: ids } });
  if (!booking) throw new Error("Booking not found");
  return booking;
}

function revalidateTechnician(bookingNumber: string) {
  revalidatePath("/technician/dashboard");
  revalidatePath("/technician/requests");
  revalidatePath(`/technician/active/${bookingNumber}`);
  revalidatePath("/technician/completed");
  revalidatePath("/technician/earnings");
}

export async function acceptBookingAction(formData: FormData) {
  const { ids } = await technicianContext();
  const parsed = bookingNumberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid booking." };
  const booking = await ownedBooking(parsed.data.bookingNumber, ids);
  if (!canTransition(booking.status, "accepted")) return { error: "This booking cannot be accepted now." };
  await (await bookings()).updateOne({ bookingNumber: booking.bookingNumber }, { $set: { status: "accepted", updatedAt: new Date().toISOString() } });
  revalidateTechnician(booking.bookingNumber); return { success: true };
}

export async function rejectBookingAction(formData: FormData) {
  const { ids } = await technicianContext();
  const parsed = bookingNumberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid booking." };
  const booking = await ownedBooking(parsed.data.bookingNumber, ids);
  if (!canTransition(booking.status, "cancelled") && booking.status !== "assigned" && booking.status !== "requested") return { error: "This booking cannot be rejected now." };
  await (await bookings()).updateOne({ bookingNumber: booking.bookingNumber }, { $set: { status: "requested", technicianId: null, updatedAt: new Date().toISOString() }, $unset: { technicianName: "" } });
  revalidateTechnician(booking.bookingNumber); return { success: true };
}

export async function updateBookingStatusAction(formData: FormData) {
  const { ids } = await technicianContext();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid status update." };
  const booking = await ownedBooking(parsed.data.bookingNumber, ids);
  if (!canTransition(booking.status, parsed.data.nextStatus)) return { error: "Invalid status transition." };
  await (await bookings()).updateOne({ bookingNumber: booking.bookingNumber }, { $set: { status: parsed.data.nextStatus, updatedAt: new Date().toISOString() } });
  revalidateTechnician(booking.bookingNumber); return { success: true };
}

export async function issueQuotationAction(formData: FormData) {
  const { ids } = await technicianContext();
  const parsed = quotationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the quotation." };
  const booking = await ownedBooking(parsed.data.bookingNumber, ids);
  if (!["arrived", "started"].includes(booking.status)) return { error: "Quotation is only available after arrival." };
  let parts: { name: string; price: number }[];
  try { parts = z.array(z.object({ name: z.string().min(1), price: z.coerce.number().nonnegative() })).parse(JSON.parse(parsed.data.parts)); } catch { return { error: "Invalid parts list." }; }
  const total = parsed.data.visitFee + parsed.data.labour + parts.reduce((sum, part) => sum + Number(part.price), 0);
  await (await bookings()).updateOne({ bookingNumber: booking.bookingNumber }, { $set: { quotation: { visitFee: parsed.data.visitFee, labour: parsed.data.labour, parts, total, amount: total, notes: parsed.data.notes, issuedAt: new Date().toISOString(), status: "pending" }, updatedAt: new Date().toISOString() } });
  revalidateTechnician(booking.bookingNumber); return { success: true };
}

export async function completeBookingAction(formData: FormData) {
  const { ids } = await technicianContext();
  const parsed = bookingNumberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid booking." };
  const booking = await ownedBooking(parsed.data.bookingNumber, ids);
  if (!canTransition(booking.status, "completed")) return { error: "Booking is not ready to complete." };
  if (booking.quotation?.status !== "accepted") return { error: "The customer must accept the quotation first." };
  await (await bookings()).updateOne({ bookingNumber: booking.bookingNumber }, { $set: { status: "completed", updatedAt: new Date().toISOString() } });
  await (await warranties()).updateOne({ id: `warranty-${booking.bookingNumber}` }, { $set: createServiceWarranty(booking, 7) }, { upsert: true });
  revalidateTechnician(booking.bookingNumber); return { success: true };
}

export async function updateAvailabilityAction(formData: FormData) {
  const { technician } = await technicianContext();
  const parsed = availabilitySchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Invalid availability." };
  let availability; try { availability = JSON.parse(parsed.data.availability); } catch { return { error: "Invalid availability." }; }
  await (await technicians()).updateOne({ _id: technician._id }, { $set: { availability, updatedAt: new Date().toISOString() } });
  revalidatePath("/technician/availability"); return { success: true };
}

export async function updateAreasAction(formData: FormData) {
  const { technician } = await technicianContext();
  const parsed = areasSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Invalid service areas." };
  let serviceAreas; try { serviceAreas = JSON.parse(parsed.data.serviceAreas); } catch { return { error: "Invalid service areas." }; }
  await (await technicians()).updateOne({ _id: technician._id }, { $set: { serviceAreas, updatedAt: new Date().toISOString() } });
  revalidatePath("/technician/areas"); return { success: true };
}
