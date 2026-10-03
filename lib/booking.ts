import "server-only";

import type { Booking, BookingStatus, Technician } from "@/types";

type TechnicianRecord = Technician & { _id?: { toString(): string } };

// Existing bookings with seeded technician ids remain readable through the
// compatibility lookup; migrate each once in mongosh, for example:
// const t = db.technicians.findOne({ id: "tech-008" });
// db.bookings.updateOne({ technicianId: "tech-008" }, { $set: { technicianId: t._id.toString() } });

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ["accepted", "assigned", "cancelled"],
  accepted: ["assigned", "cancelled"],
  assigned: ["on_the_way", "cancelled"],
  on_the_way: ["arrived", "cancelled"],
  arrived: ["started", "cancelled"],
  started: ["completed", "cancelled"],
  completed: ["customer_confirmed"],
  customer_confirmed: ["closed"],
  closed: [],
  cancelled: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus) {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assignTechnician(booking: Booking, allTechnicians: TechnicianRecord[]) {
  const serviceSlug = booking.serviceSlug;
  console.log("[assign] service:", serviceSlug);
  console.log("[assign] total techs:", allTechnicians.length);
  const eligible = allTechnicians.filter((technician) =>
    technician.active === true &&
    technician.verified === true &&
    Array.isArray(technician.skills) &&
    technician.skills.some((skill) => skill.serviceSlug === serviceSlug),
  );
  console.log("[assign] eligible after filter:", eligible.length);
  eligible.forEach((technician) =>
    console.log("[assign] candidate:", technician.id, technician.name, technician.skills.map((skill) => skill.serviceSlug)),
  );
  if (eligible.length === 0) {
    console.log("[assign] NO MATCH — booking left unassigned");
    return null;
  }
  if (!canTransition(booking.status, "assigned")) throw new Error("Invalid booking transition");

  const requestedArea = booking.address.area.toLowerCase();
  const scheduledDay = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(booking.scheduledAt)).toLowerCase();
  const scored = eligible.map((technician) => {
    const areaScore = technician.serviceAreas.some((area) => area.toLowerCase() === requestedArea) ? 100 : 0;
    const availabilityScore = technician.availability?.some((day) => day.day.toLowerCase().startsWith(scheduledDay.slice(0, 2))) ? 25 : 0;
    const ratingScore = technician.rating * 10;
    const workloadScore = Math.max(0, 20 - Math.min(20, technician.completedJobs / 10));
    return { technician, score: areaScore + availabilityScore + ratingScore + workloadScore };
  });
  const winner = scored.sort((a, b) => b.score - a.score)[0].technician;
  const technicianId = winner._id?.toString();
  if (!technicianId) throw new Error("Technician Mongo _id is required for assignment");
  console.log("[assign] winner:", technicianId, winner.name, "reason: exact skill match, service area, availability, rating, and workload score");
  return { technicianId, technicianName: winner.name, status: "assigned" as const };
}

export function issueQuotation(booking: Booking, amount: number, notes = "") {
  if (!["arrived", "started"].includes(booking.status) || amount < 0) throw new Error("Quotation is not available");
  return { quotation: { amount, notes, issuedAt: new Date().toISOString(), status: "pending" as const } };
}

export function acceptQuotation(booking: Booking) {
  if (booking.quotation?.status !== "pending") throw new Error("Quotation is not pending");
  return { quotation: { ...booking.quotation, status: "accepted" as const } };
}

export function rejectQuotation(booking: Booking) {
  if (booking.quotation?.status !== "pending") throw new Error("Quotation is not pending");
  return { quotation: { ...booking.quotation, status: "rejected" as const } };
}

export function completeBooking(booking: Booking) {
  if (!canTransition(booking.status, "completed")) throw new Error("Invalid booking transition");
  return { status: "completed" as const, updatedAt: new Date().toISOString() };
}
