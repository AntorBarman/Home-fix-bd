"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/rbac";
import { complaints } from "@/lib/mongodb";
import { replySchema, ticketSchema } from "@/lib/schemas/support";
function ticketNumber() { return `SP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`; }
export async function createTicketAction(formData: FormData) {
  const session = await requireUser(); const parsed = ticketSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Please check the ticket.", fieldErrors: parsed.error.flatten().fieldErrors };
  const now = new Date().toISOString(); const number = ticketNumber(); const doc = { ticketNumber: number, customerId: session.user.id, customerName: session.user.name, customerEmail: session.user.email, ...parsed.data, status: "open" as const, messages: [{ id: crypto.randomUUID(), author: session.user.name || session.user.email, authorRole: "customer" as const, body: parsed.data.description, createdAt: now }], createdAt: now, updatedAt: now };
  await (await complaints()).insertOne(doc); redirect(`/account/support/${number}`);
}
export async function replyTicketAction(formData: FormData) {
  const session = await requireUser(); const parsed = replySchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Invalid reply." };
  const admin = session.user.role === "admin"; const ticket = await (await complaints()).findOne({ ticketNumber: parsed.data.ticketId }); if (!ticket || (!admin && ticket.customerId !== session.user.id)) return { error: "Ticket not found." };
  await (await complaints()).updateOne({ ticketNumber: parsed.data.ticketId }, { $push: { messages: { id: crypto.randomUUID(), author: session.user.name || session.user.email, authorRole: admin ? "admin" : "customer", body: parsed.data.message, createdAt: new Date().toISOString() } }, $set: { updatedAt: new Date().toISOString(), ...(admin && ticket.status === "open" ? { status: "in_progress" } : {}) } }); revalidatePath(`/account/support/${parsed.data.ticketId}`); return { success: true };
}
export async function updateTicketStatusAction(ticketNumberValue: string, status: "open" | "in_progress" | "resolved" | "closed") { await requireAdmin(); await (await complaints()).updateOne({ ticketNumber: ticketNumberValue }, { $set: { status, updatedAt: new Date().toISOString() } }); revalidatePath("/admin/complaints"); return { success: true }; }
