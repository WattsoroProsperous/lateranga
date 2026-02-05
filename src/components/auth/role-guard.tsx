"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import type { UserRole } from "@/types/database.types";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  showLoader?: boolean;
}

/**
 * Component that only renders children if the current user has one of the allowed roles.
 */
export function RoleGuard({ children, allowedRoles, fallback = null, showLoader = false }: RoleGuardProps) {
  const { role, isLoading } = useCurrentUser();

  if (isLoading && showLoader) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return null;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Only show content to staff members (non-customers).
 */
export function StaffOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "admin", "cashier", "chef"]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Only show content to managers (admin or super_admin).
 */
export function ManagerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "admin"]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Only show content to super_admin.
 */
export function SuperAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["super_admin"]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Only show content to POS users (super_admin, admin, cashier).
 */
export function POSAccessOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "admin", "cashier"]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Only show content to kitchen users (super_admin, admin, chef).
 */
export function KitchenAccessOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "admin", "chef"]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Only show content to users who can cancel orders (super_admin, admin, chef).
 */
export function CanCancelOrdersOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "admin", "chef"]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}
