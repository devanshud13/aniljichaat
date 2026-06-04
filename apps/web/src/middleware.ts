import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/manager": ["MANAGER", "ADMIN"],
  "/kitchen": ["KITCHEN", "ADMIN", "MANAGER"],
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  for (const [route] of Object.entries(protectedRoutes)) {
    if (path.startsWith(route)) {
      // Auth is validated server-side via API cookies; client routes rely on API 401
      return NextResponse.next();
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/kitchen/:path*"],
};
