import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const session = request.auth;
  const publicAuthPath = ["/signin", "/register", "/forgot-password"].includes(pathname) || pathname.startsWith("/reset-password/");
  if (publicAuthPath) return NextResponse.next();

  const protectedArea = pathname === "/checkout" || pathname.startsWith("/account") || pathname.startsWith("/admin") || pathname.startsWith("/technician") || pathname.startsWith("/seller");
  if (!protectedArea) return NextResponse.next();
  if (!session?.user) return NextResponse.redirect(new URL(`/signin?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
  if (pathname.startsWith("/admin") && session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) return NextResponse.redirect(new URL("/", request.url));
  if (pathname.startsWith("/technician") && session.user.role !== "technician") return NextResponse.redirect(new URL("/", request.url));
  if (pathname.startsWith("/seller") && session.user.role !== "seller") return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/technician/:path*", "/seller/:path*", "/account/:path*", "/checkout", "/signin", "/register", "/forgot-password", "/reset-password/:path*"],
};
