import { requireSeller } from "@/lib/rbac";
import { sellers } from "@/lib/mongodb";
import { toPlain } from "@/lib/serializers";
import { SellerSettingsForm } from "./settings-form";
export default async function SellerSettingsPage() { const session = await requireSeller(); const seller = await (await sellers()).findOne({ userId: session.user.id }); return <><h2 className="display text-4xl font-semibold">Store settings / দোকানের সেটিংস</h2><p className="mt-3 text-foreground/60">Manage your business and payout information / ব্যবসার তথ্য ও পেমেন্ট তথ্য</p><SellerSettingsForm seller={seller ? toPlain(seller) : null} fallbackName={session.user.name ?? ""} /></>; }
