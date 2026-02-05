import type { UserRole } from "@/types/database.types";

// ============================================
// Role Definitions
// ============================================

export const ROLES = {
  SUPER_ADMIN: "super_admin" as UserRole,
  ADMIN: "admin" as UserRole,
  CASHIER: "cashier" as UserRole,
  CHEF: "chef" as UserRole,
  CUSTOMER: "customer" as UserRole,
} as const;

// Staff roles (non-customer)
export const STAFF_ROLES: UserRole[] = ["super_admin", "admin", "cashier", "chef"];

// Manager roles (can manage settings, users, etc.)
export const MANAGER_ROLES: UserRole[] = ["super_admin", "admin"];

// ============================================
// Permission Definitions
// ============================================

export const PERMISSIONS = {
  // POS / Caisse
  POS_ACCESS: ["super_admin", "admin", "cashier"] as UserRole[],
  POS_DELETE_SALE: ["super_admin"] as UserRole[],

  // Orders
  ORDERS_VIEW: ["super_admin", "admin", "cashier", "chef"] as UserRole[],
  ORDERS_MANAGE: ["super_admin", "admin", "cashier"] as UserRole[],
  ORDERS_CANCEL: ["super_admin", "admin", "chef"] as UserRole[],

  // Kitchen
  KITCHEN_ACCESS: ["super_admin", "admin", "chef"] as UserRole[],

  // Tables
  TABLES_VIEW: ["super_admin", "admin", "cashier"] as UserRole[],
  TABLES_MANAGE: ["super_admin", "admin", "cashier"] as UserRole[],

  // Payment
  PAYMENT_VALIDATE: ["super_admin", "admin", "cashier"] as UserRole[],

  // Stock
  STOCK_VIEW: ["super_admin", "admin", "cashier", "chef"] as UserRole[],
  STOCK_MANAGE: ["super_admin", "admin"] as UserRole[],
  INGREDIENT_REQUEST: ["super_admin", "admin", "chef"] as UserRole[],

  // Menu
  MENU_VIEW: ["super_admin", "admin", "cashier", "chef"] as UserRole[],
  MENU_MANAGE: ["super_admin", "admin"] as UserRole[],

  // Reports
  REPORTS_VIEW_FULL: ["super_admin", "admin"] as UserRole[],
  REPORTS_VIEW_LIMITED: ["cashier"] as UserRole[],

  // Users
  USERS_MANAGE: ["super_admin", "admin"] as UserRole[],

  // Settings
  SETTINGS_MANAGE: ["super_admin", "admin"] as UserRole[],

  // Gallery
  GALLERY_MANAGE: ["super_admin", "admin"] as UserRole[],

  // Reviews
  REVIEWS_MANAGE: ["super_admin", "admin"] as UserRole[],
} as const;

// ============================================
// Permission Check Functions
// ============================================

export function hasPermission(userRole: UserRole | null | undefined, permission: UserRole[]): boolean {
  if (!userRole) return false;
  return permission.includes(userRole);
}

export function isStaff(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return STAFF_ROLES.includes(role);
}

export function isManager(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return MANAGER_ROLES.includes(role);
}

export function canAccessPOS(role: UserRole | null | undefined): boolean {
  return hasPermission(role, PERMISSIONS.POS_ACCESS);
}

export function canDeleteSale(role: UserRole | null | undefined): boolean {
  return hasPermission(role, PERMISSIONS.POS_DELETE_SALE);
}

export function canCancelOrder(role: UserRole | null | undefined): boolean {
  return hasPermission(role, PERMISSIONS.ORDERS_CANCEL);
}

export function canAccessKitchen(role: UserRole | null | undefined): boolean {
  return hasPermission(role, PERMISSIONS.KITCHEN_ACCESS);
}

export function canManageStock(role: UserRole | null | undefined): boolean {
  return hasPermission(role, PERMISSIONS.STOCK_MANAGE);
}

export function canRequestIngredients(role: UserRole | null | undefined): boolean {
  return hasPermission(role, PERMISSIONS.INGREDIENT_REQUEST);
}

export function canValidatePayment(role: UserRole | null | undefined): boolean {
  return hasPermission(role, PERMISSIONS.PAYMENT_VALIDATE);
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return hasPermission(role, PERMISSIONS.USERS_MANAGE);
}

// ============================================
// Route Access Configuration
// ============================================

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/admin": STAFF_ROLES,
  "/admin/pos": PERMISSIONS.POS_ACCESS,
  "/admin/orders": PERMISSIONS.ORDERS_VIEW,
  "/admin/kitchen": PERMISSIONS.KITCHEN_ACCESS,
  "/admin/tables": PERMISSIONS.TABLES_VIEW,
  "/admin/stock": PERMISSIONS.STOCK_VIEW,
  "/admin/menu": PERMISSIONS.MENU_VIEW,
  "/admin/reports": [...PERMISSIONS.REPORTS_VIEW_FULL, ...PERMISSIONS.REPORTS_VIEW_LIMITED],
  "/admin/gallery": PERMISSIONS.GALLERY_MANAGE,
  "/admin/reviews": PERMISSIONS.REVIEWS_MANAGE,
  "/admin/users": PERMISSIONS.USERS_MANAGE,
  "/admin/settings": PERMISSIONS.SETTINGS_MANAGE,
};

export function canAccessRoute(role: UserRole | null | undefined, pathname: string): boolean {
  if (!role) return false;

  // Check exact match first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname].includes(role);
  }

  // Check prefix match for nested routes
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route + "/") || pathname === route) {
      return allowedRoles.includes(role);
    }
  }

  // Default: allow staff access to /admin routes
  if (pathname.startsWith("/admin")) {
    return STAFF_ROLES.includes(role);
  }

  return true;
}

// ============================================
// Role Labels (French)
// ============================================

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrateur",
  cashier: "Caissier(e)",
  chef: "Chef de Cuisine",
  customer: "Client",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role;
}
