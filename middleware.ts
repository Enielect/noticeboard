import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  // const token = request.cookies.get("auth-token")?.value;
  const token = (await cookies()).get("auth-token")?.value;

  // Protected routes
  const protectedPaths = ["/dashboard", "/api/notices", "/api/chat"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    if (!token) {
      // For API routes, return 401 instead of redirect
      if (request.nextUrl.pathname.startsWith("/api/")) {
        console.log("redirect from middleware");
        return NextResponse.json(
          { error: "Unauthorized - Please login" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      verifyToken(token || "");
    } catch {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unable to verify token" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/notices/:path*", "/api/chat/:path*"], // '/board/:path* (should include board in protected routes if needed)
};
