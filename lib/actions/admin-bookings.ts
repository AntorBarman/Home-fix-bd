"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { bookings, technicians } from "@/lib/mongodb";
import { statusSchema } from "@/lib/schemas/admin";
import type { BookingStatus } from "@/types";
export async function updateAdminBookingStatusAction(formData: FormData) { await requireAdmin(); const parsed = statusSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Invalid booking status." }; const status = parsed.data.status as BookingStatus; await (await bookings()).updateOne({ bookingNumber: parsed.data.id }, { $set: { status, updatedAt: new Date().toISOString() } }); revalidatePath("/admin/bookings"); return { success: true }; }
export async function assignBookingAction(formData: FormData) { await requireAdmin(); const bookingNumber = String(formData.get("bookingNumber")); const technicianId = String(formData.get("technicianId")); const tech = await (await technicians()).findOne({ id: technicianId }); if (!tech || !tech.active || !tech.verified || !tech.skills.some((skill) => skill.serviceSlug === String(formData.get("serviceSlug")))) return { error: "Technician is not eligible for this service." }; await (await bookings()).updateOne({ bookingNumber }, { $set: { technicianId: tech._id.toString(), technicianName: tech.name, status: "assigned", updatedAt: new Date().toISOString() } }); revalidatePath("/admin/bookings"); return { success: true }; }
export async function cancelBookingAction(bookingNumber: string) { await requireAdmin(); await (await bookings()).updateOne({ bookingNumber }, { $set: { status: "cancelled", updatedAt: new Date().toISOString() } }); revalidatePath("/admin/bookings"); return { success: true }; }
