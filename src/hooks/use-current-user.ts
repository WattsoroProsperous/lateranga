"use client";

import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/types/database.types";

// Re-export useAuth as useCurrentUser for backward compatibility
export function useCurrentUser() {
  return useAuth();
}

export function useHasPermission(allowedRoles: UserRole[]): boolean {
  const { role } = useAuth();
  return role !== null && allowedRoles.includes(role);
}

export function useCanAccessPOS(): boolean {
  return useHasPermission(["super_admin", "admin", "cashier"]);
}

export function useCanCancelOrders(): boolean {
  return useHasPermission(["super_admin", "admin", "chef"]);
}

export function useCanDeleteSales(): boolean {
  return useHasPermission(["super_admin"]);
}

export function useCanAccessKitchen(): boolean {
  return useHasPermission(["super_admin", "admin", "chef"]);
}

export function useCanManageStock(): boolean {
  return useHasPermission(["super_admin", "admin"]);
}

export function useCanValidatePayments(): boolean {
  return useHasPermission(["super_admin", "admin", "cashier"]);
}

export function useCanManageUsers(): boolean {
  return useHasPermission(["super_admin", "admin"]);
}
