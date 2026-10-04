import { requireSeller } from "@/lib/rbac";
import { sellers } from "@/lib/mongodb";
import { SellerSidebar, SellerTopbar } from "@/components/seller/seller-shell";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSeller();
  const seller = await (await sellers()).findOne({ userId: session.user.id });
  return <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[240px_1fr] sm:px-6"><SellerSidebar /><section><SellerTopbar businessName={seller?.businessName ?? session.user.name ?? "Seller"} email={session.user.email ?? ""} />{children}</section></main>;
}
