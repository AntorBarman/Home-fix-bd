import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { services } from "@/lib/mongodb";
export default async function Services() { await requireAdmin(); const list = await (await services()).find({}).sort({ name: 1 }).toArray(); return <div><h2 className="display text-4xl font-semibold">Services / সার্ভিস</h2><div className="mt-8 divide-y divide-border border-y border-border">{list.map((service) => <Link href={`/admin/services/${service.slug}`} className="flex justify-between py-4 text-sm" key={service.slug}><span><strong>{service.name}</strong> · {service.nameBn}</span><span>৳{service.priceFrom}–৳{service.priceTo}</span></Link>)}</div></div>; }
