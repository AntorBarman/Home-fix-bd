import { redirect } from "next/navigation";
import { requireUser } from "@/lib/rbac";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  if (session.user.role !== "customer") {
    if (session.user.role === "technician") redirect("/technician/dashboard");
    if (session.user.role === "seller") redirect("/seller/dashboard");
    if (session.user.role === "admin") redirect("/admin/dashboard");
    redirect("/");
  }

  return <>{children}</>;
}