import Link from "next/link";
import { requireTechnician } from "@/lib/rbac";
import { bookings, technicians } from "@/lib/mongodb";
import { Storefront } from "@/components/storefront";

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const session = await requireTechnician();
  const tech = await (await technicians()).findOne({ userId: session.user.id });
  const ids = tech ? [tech.id, tech._id.toString()] : [];
  const pending = await (await bookings()).countDocuments({ technicianId: { $in: ids }, status: { $in: ["requested", "assigned"] } });
  return <Storefront><div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]"><aside className="h-fit border border-border p-4"><p className="display text-xl font-semibold">Technician desk</p><nav className="mt-5 grid gap-1 text-sm">{[["/technician/dashboard","Dashboard"],["/technician/requests",`Requests (${pending})`],["/technician/completed","Completed"],["/technician/earnings","Earnings"],["/technician/reviews","Reviews"],["/technician/availability","Availability"],["/technician/areas","Areas"],["/technician/profile","Profile"]].map(([href, label]) => <Link href={href} key={href} className="px-3 py-2 hover:bg-muted">{label}</Link>)}</nav></aside><section>{children}</section></div></Storefront>;
}
