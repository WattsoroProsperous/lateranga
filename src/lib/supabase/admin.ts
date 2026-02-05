import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./server";
import type { Database, UserRole, Profile } from "@/types/database.types";
import { STAFF_ROLES, MANAGER_ROLES, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

/**
 * Admin Supabase client with service_role key.
 * WARNING: Only use server-side. Bypasses RLS.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Get the current authenticated user or null.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's profile with role information.
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/**
 * Get the current user's role.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const profile = await getCurrentUserProfile();
  return profile?.role ?? null;
}

/**
 * Check if the current authenticated user has admin role (admin or super_admin).
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "admin" || role === "super_admin";
}

/**
 * Check if the current user is staff (any non-customer role).
 */
export async function isCurrentUserStaff(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role !== null && STAFF_ROLES.includes(role);
}

/**
 * Check if the current user is a manager (admin or super_admin).
 */
export async function isCurrentUserManager(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role !== null && MANAGER_ROLES.includes(role);
}

/**
 * Check if the current user has a specific role.
 */
export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role !== null && allowedRoles.includes(role);
}

/**
 * Check if the current user has a specific permission.
 */
export async function userHasPermission(permission: UserRole[]): Promise<boolean> {
  const role = await getCurrentUserRole();
  return hasPermission(role, permission);
}

/**
 * Check if the current user can access the POS.
 */
export async function canAccessPOS(): Promise<boolean> {
  return userHasPermission(PERMISSIONS.POS_ACCESS);
}

/**
 * Check if the current user can cancel orders.
 */
export async function canCancelOrders(): Promise<boolean> {
  return userHasPermission(PERMISSIONS.ORDERS_CANCEL);
}

/**
 * Check if the current user can delete sales.
 */
export async function canDeleteSales(): Promise<boolean> {
  return userHasPermission(PERMISSIONS.POS_DELETE_SALE);
}

/**
 * Check if the current user can access the kitchen view.
 */
export async function canAccessKitchen(): Promise<boolean> {
  return userHasPermission(PERMISSIONS.KITCHEN_ACCESS);
}

/**
 * Check if the current user can manage stock.
 */
export async function canManageStock(): Promise<boolean> {
  return userHasPermission(PERMISSIONS.STOCK_MANAGE);
}

/**
 * Check if the current user can validate payments.
 */
export async function canValidatePayments(): Promise<boolean> {
  return userHasPermission(PERMISSIONS.PAYMENT_VALIDATE);
}

/**
 * Check if the current user can manage users.
 */
export async function canManageUsers(): Promise<boolean> {
  return userHasPermission(PERMISSIONS.USERS_MANAGE);
}

/**
 * Get user profile by ID.
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return profile;
}

/**
 * Update user role (admin only).
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
  const canManage = await canManageUsers();
  if (!canManage) {
    return { success: false, error: "Permission denied" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all staff members (non-customer users).
 */
export async function getStaffMembers(): Promise<Profile[]> {
  const adminClient = createAdminClient();
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("*")
    .in("role", STAFF_ROLES)
    .order("created_at", { ascending: false });

  return profiles ?? [];
}
