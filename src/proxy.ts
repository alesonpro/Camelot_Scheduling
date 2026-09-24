import { NextResponse, type NextRequest } from "next/server";

import { createMiddlewareClient } from "@/lib/supabase/middleware";
import {
  dashboardPathForRole,
  isRole,
  ROLE_ROUTE_PREFIXES,
  type Role,
} from "@/lib/auth/roles";

const PUBLIC_PATHS = ["/unauthorized", "/api/health"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith("/auth/callback")
  );
}

function routeRoleForPath(pathname: string): Role | null {
  if (pathname.startsWith("/agent")) return "agent";
  if (pathname.startsWith("/receptionist")) return "receptionist";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fail closed: any error while checking auth (including a missing/invalid
  // Supabase configuration) is treated as "not signed in", never a crash.
  let role: Role | null = null;
  let response: NextResponse | null = null;
  try {
    const { supabase, getResponse } = createMiddlewareClient(request);
    response = getResponse();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile && isRole(profile.role)) {
        role = profile.role;
      }
    }
    response = getResponse();
  } catch {
    role = null;
  }

  const passThrough = response ?? NextResponse.next({ request });

  if (pathname === "/login") {
    if (role) {
      return NextResponse.redirect(new URL(dashboardPathForRole(role), request.url));
    }
    return passThrough;
  }

  if (isPublicPath(pathname)) {
    return passThrough;
  }

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(dashboardPathForRole(role), request.url));
  }

  const requiredForRoute = routeRoleForPath(pathname);
  if (requiredForRoute && !ROLE_ROUTE_PREFIXES[requiredForRoute].includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return passThrough;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
