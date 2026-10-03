import { requireSeller } from "@/lib/rbac";
import { sellers } from "@/lib/mongodb";
import { Storefront } from "@/components/storefront";
import { SellerSettingsForm } from "./settings-form";
import { toPlain } from "@/lib/serializers";
export default async function SellerSettingsPage() { const session = await requireSeller(); const seller = await (await sellers()).findOne({ userId: session.user.id }); return <Storefront><main className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><h1 className="display text-5xl font-semibold">Seller settings</h1><p className="mt-3 text-foreground/60">Complete your store profile / আপনার দোকানের তথ্য সম্পূর্ণ করুন</p><SellerSettingsForm seller={seller ? toPlain(seller) : null} fallbackName={session.user.name ?? ""} /></main></Storefront>; }
