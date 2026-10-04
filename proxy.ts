import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const session = request.auth;
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL(`/signin?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
  }
  if (pathname.startsWith("/admin") && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/technician") && session.user.role !== "technician") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/seller") && session.user.role !== "seller") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/technician/:path*", "/seller/:path*", "/account/:path*", "/checkout/:path*"],
};
