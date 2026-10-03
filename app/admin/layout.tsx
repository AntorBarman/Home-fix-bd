import { requireAdmin } from "@/lib/rbac";
import { AdminSidebar, AdminTopbar } from "@/components/admin/admin-shell";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const session = await requireAdmin(); return <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[230px_1fr]"><AdminSidebar /><main><AdminTopbar email={session.user.email} />{children}</main></div>; }
