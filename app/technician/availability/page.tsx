import { requireTechnician } from "@/lib/rbac";
import { technicians } from "@/lib/mongodb";
import { AvailabilityForm } from "./availability-form";
export default async function Availability() { const session = await requireTechnician(); const tech = await (await technicians()).findOne({ userId: session.user.id }); return <main><h1 className="display text-5xl font-semibold">Availability / সময়সূচি</h1><AvailabilityForm initial={tech?.availability ?? []} /></main>; }
