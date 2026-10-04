import { requireTechnician } from "@/lib/rbac";
import { technicians, services } from "@/lib/mongodb";
import { TechnicianProfileForm } from "./profile-form";
import { toPlain, toPlainArray } from "@/lib/serializers";

export default async function TechnicianProfilePage() {
  const session = await requireTechnician();
  const [tech, serviceList] = await Promise.all([(await technicians()).findOne({ userId: session.user.id }), (await services()).find({}).toArray()]);
  if (!tech) return <main className="mx-auto max-w-3xl px-4 py-12"><p>Technician profile not found.</p></main>;
  const message = tech.verificationStatus === "pending" ? "আপনার প্রোফাইল অসম্পূর্ণ। সম্পূর্ণ করুন এবং যাচাইয়ের জন্য জমা দিন।" : tech.verificationStatus === "under_review" ? "আপনার প্রোফাইল যাচাই করা হচ্ছে। ২৪ ঘণ্টার মধ্যে জানানো হবে।" : tech.verificationStatus === "verified" ? "আপনি যাচাইকৃত। এখন কাজ পাবেন।" : tech.verificationStatus === "rejected" ? `আপনার প্রোফাইল প্রত্যাখ্যাত। কারণ: ${(tech as typeof tech & { rejectionReason?: string }).rejectionReason ?? "দয়া করে তথ্য সংশোধন করুন।"}` : "আপনার অ্যাকাউন্ট স্থগিত।";
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><h1 className="display text-5xl font-semibold">Technician profile</h1><p className={`mt-5 border p-4 text-sm ${tech.verificationStatus === "verified" ? "border-success bg-success/10" : tech.verificationStatus === "rejected" || tech.verificationStatus === "suspended" ? "border-sale bg-sale/10" : "border-border bg-muted"}`}>{message}</p><TechnicianProfileForm technician={toPlain(tech)} services={toPlainArray(serviceList)} /></main>;
}
