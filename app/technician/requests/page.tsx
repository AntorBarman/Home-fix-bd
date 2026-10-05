import { requireTechnician } from "@/lib/rbac";
import { technicians } from "@/lib/mongodb";
import { getTechnicianRequests } from "@/lib/technician-requests";
import RequestActions from "@/components/technician/request-actions";

export const dynamic = "force-dynamic";

export default async function TechnicianRequests() {
  const session = await requireTechnician();
  const tech = await (await technicians()).findOne({
    userId: session.user.id as string,
  });

  if (!tech) {
    return (
      <p className="text-sm text-foreground/60">
        Technician profile not found.
      </p>
    );
  }

  const list = await getTechnicianRequests(tech);

  return (
    <main>
      <p className="text-xs uppercase tracking-[.2em] text-sale">
        Incoming work
      </p>
      <h1 className="display mt-2 text-5xl font-semibold">
        Requests / অনুরোধ
      </h1>

      <div className="mt-8 grid gap-5">
        {list.map((job) => (
          <article className="border border-border p-5" key={job.bookingNumber}>
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="font-semibold">{job.serviceName}</h2>
              <span className="text-xs uppercase tracking-wider">
                {job.technicianId ? job.status : "open"}
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/70">
              <strong>{job.customerName}</strong> ·{" "}
              <a className="underline" href={`tel:${job.customerPhone}`}>
                {job.customerPhone}
              </a>
            </p>
            <p className="mt-2 text-sm text-foreground/60">
              {job.address?.area || job.address?.line1} ·{" "}
              {new Date(job.scheduledAt).toLocaleString()} · Visit ৳
              {job.visitFee}
            </p>
            <p className="mt-3 text-sm leading-6">{job.problemDescription}</p>
            <RequestActions bookingNumber={job.bookingNumber} />
          </article>
        ))}

        {!list.length && (
          <p className="border border-border p-10 text-center text-foreground/60">
            কোনো অনুরোধ নেই
          </p>
        )}
      </div>
    </main>
  );
}