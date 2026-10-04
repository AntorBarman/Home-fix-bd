import { redirect } from "next/navigation";
import Link from "next/link";
import { requireTechnician } from "@/lib/rbac";
import { technicians } from "@/lib/mongodb";

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireTechnician();
  const tech = await (await technicians()).findOne({
    userId: session.user.id as string,
  });

  if (!tech) {
    redirect("/technician/profile?onboarding=1");
  }

  const displayName = tech.nameBn || tech.name || session.user.email;
  const verified = tech.verificationStatus === "verified";

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Topbar ─────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="display text-xl font-bold tracking-tight">
            HomeFix <span className="text-sale">BD</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3 text-sm">
            {/* Verification badge */}
            <span
              className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline ${
                verified
                  ? "bg-green-100 text-green-900"
                  : "bg-yellow-100 text-yellow-900"
              }`}
            >
              {verified ? "Verified" : "Pending verification"}
            </span>

            {/* Technician name */}
            <span className="hidden text-foreground/70 md:inline">
              {displayName}
            </span>

            {/* View storefront */}
            <Link
              href="/"
              className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              View storefront
            </Link>

            {/* Sign out */}
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/auth");
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-xs text-foreground/60 hover:text-sale"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ─── Main Layout: Sidebar + Content ─── */}
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside>
            <div className="lg:sticky lg:top-24">
              <h2 className="display text-lg font-semibold">
                Technician desk
              </h2>
              <nav className="mt-4 grid gap-1 text-sm">
                <TechnicianNavLink href="/technician/dashboard">
                  Dashboard
                </TechnicianNavLink>
                <TechnicianNavLink href="/technician/requests">
                  Requests
                </TechnicianNavLink>
                <TechnicianNavLink href="/technician/active">
                  Active job
                </TechnicianNavLink>
                <TechnicianNavLink href="/technician/completed">
                  Completed
                </TechnicianNavLink>
                <TechnicianNavLink href="/technician/earnings">
                  Earnings
                </TechnicianNavLink>
                <TechnicianNavLink href="/technician/reviews">
                  Reviews
                </TechnicianNavLink>
                <TechnicianNavLink href="/technician/availability">
                  Availability
                </TechnicianNavLink>
                <TechnicianNavLink href="/technician/areas">
                  Areas
                </TechnicianNavLink>
                <TechnicianNavLink href="/technician/profile">
                  Profile
                </TechnicianNavLink>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      {/* ─── Footer ─────────────────────────── */}
      <footer className="mt-20 border-t border-border bg-muted py-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 text-xs text-foreground/50 sm:px-6">
          <p>© 2026 HomeFix BD · Technician workspace</p>
          <div className="flex gap-4">
            <Link href="/faq" className="hover:underline">FAQ</Link>
            <Link href="/contact" className="hover:underline">Support</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Nav Link Component ────────────────
import { headers } from "next/headers";

async function TechnicianNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`rounded px-3 py-2 transition ${
        isActive
          ? "bg-foreground text-background font-medium"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}