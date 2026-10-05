import { bookings } from "@/lib/mongodb";

type TechLike = {
  _id: { toString(): string };
  id?: string;
  skills?: { serviceSlug: string }[];
};

/**
 * Technician-এর Requests তালিকা:
 *  ১) তাকে assign করা job (status = assigned)
 *  ২) কেউ নেয়নি এমন open job (status = requested, technicianId = null)
 *     যা তার skill-এর সাথে মেলে এবং সে আগে reject করেনি
 */
export async function getTechnicianRequests(tech: TechLike) {
  const ids = [tech._id.toString(), tech.id].filter(Boolean) as string[];
  const slugs = (tech.skills ?? []).map((s) => s.serviceSlug);

  const filter = {
    $or: [
      { technicianId: { $in: ids }, status: "assigned" },
      {
        technicianId: null,
        status: "requested",
        serviceSlug: { $in: slugs },
        rejectedBy: { $nin: ids },
      },
    ],
  };

  return (await bookings())
    .find(filter as never)
    .sort({ scheduledAt: 1 })
    .toArray();
}