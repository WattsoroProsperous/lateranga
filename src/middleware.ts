import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/types/database.types";

// Staff roles that can access admin panel
const STAFF_ROLES: UserRole[] = ["super_admin", "admin", "cashier", "chef"];

// Route-specific permissions
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/admin/pos": ["super_admin", "admin", "cashier"],
  "/admin/kitchen": ["super_admin", "admin", "chef"],
  "/admin/tables": ["super_admin", "admin", "cashier"],
  "/admin/stock": ["super_admin", "admin", "cashier", "chef"],
  "/admin/menu": ["super_admin", "admin", "cashier", "chef"],
  "/admin/orders": ["super_admin", "admin", "cashier", "chef"],
  "/admin/reports": ["super_admin", "admin", "cashier"],
  "/admin/gallery": ["super_admin", "admin"],
  "/admin/reviews": ["super_admin", "admin"],
  "/admin/users": ["super_admin", "admin"],
  "/admin/settings": ["super_admin", "admin"],
};

function canAccessRoute(role: UserRole, pathname: string): boolean {
  // Check exact match first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname].includes(role);
  }

  // Check prefix match for nested routes
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route + "/")) {
      return allowedRoles.includes(role);
    }
  }

  // Default: allow any staff to access /admin base routes
  if (pathname === "/admin" || pathname.startsWith("/admin")) {
    return STAFF_ROLES.includes(role);
  }

  return true;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - IMPORTANT: do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Table routes are public (QR code access)
  if (pathname.startsWith("/table/")) {
    return supabaseResponse;
  }

  // Protect /admin routes - require staff role
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Use service role to bypass RLS for role check
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role as UserRole | undefined;

    // Check if user is staff
    if (!userRole || !STAFF_ROLES.includes(userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Check route-specific permissions
    if (!canAccessRoute(userRole, pathname)) {
      // Redirect to admin dashboard if they don't have access to specific route
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
