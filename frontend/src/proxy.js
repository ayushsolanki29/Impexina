// proxy.js
import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Redirect unauthenticated users from dashboard to login
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
  }

  // Redirect authenticated users from login to dashboard
  if (pathname === "/auth/login" && token) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/login"],
};

//helloo
