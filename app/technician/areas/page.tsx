import { requireTechnician } from "@/lib/rbac";
import { technicians } from "@/lib/mongodb";
import { AreasForm } from "./areas-form";
export default async function Areas() { const session = await requireTechnician(); const tech = await (await technicians()).findOne({ userId: session.user.id }); return <main><h1 className="display text-5xl font-semibold">Service areas / সেবার এলাকা</h1><AreasForm initial={tech?.serviceAreas ?? []} /></main>; }
