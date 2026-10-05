import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const session = request.auth;

  // ─── Special: payment callbacks bypass auth ───────────
  // SSLCOMMERZ POSTs from server (no cookies) → success page
  // must not require login on this redirect chain.
  const paymentPaths = [
    "/api/payments/sslcommerz",
    "/api/payments/bkash",
    "/api/payments/nagad",
    "/checkout/success",
    "/checkout/fail",
    "/checkout/cancel",
  ];

  if (
    paymentPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    )
  ) {
    return NextResponse.next();
  }

  // ─── Auth required for everything else ────────────────
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL(
        `/signin?callbackUrl=${encodeURIComponent(pathname)}`,
        request.url
      )
    );
  }

  // ─── Role-based guards ────────────────────────────────
  if (pathname.startsWith("/admin") && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/technician") && session.user.role !== "technician") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/seller") && session.user.role !== "seller") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/account") && session.user.role !== "customer") {
    if (session.user.role === "admin")
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (session.user.role === "seller")
      return NextResponse.redirect(new URL("/seller/dashboard", request.url));
    if (session.user.role === "technician")
      return NextResponse.redirect(
        new URL("/technician/dashboard", request.url)
      );
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/technician/:path*",
    "/seller/:path*",
    "/account/:path*",
    "/checkout/:path*",
    "/api/payments/:path*",
  ],
};