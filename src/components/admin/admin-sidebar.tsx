"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/store/brand-logo";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { UserRole } from "@/types/database.types";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import {
  LayoutDashboard,
  Calculator,
  ShoppingBag,
  BarChart3,
  UtensilsCrossed,
  Image,
  MessageSquare,
  ArrowLeft,
  ChefHat,
  QrCode,
  Package,
  Users,
  Settings,
  Loader2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "cashier", "chef"],
  },
  {
    label: "Caisse (POS)",
    href: "/admin/pos",
    icon: Calculator,
    roles: ["super_admin", "admin", "cashier"],
  },
  {
    label: "Cuisine",
    href: "/admin/kitchen",
    icon: ChefHat,
    roles: ["super_admin", "admin", "chef"],
  },
  {
    label: "Commandes",
    href: "/admin/orders",
    icon: ShoppingBag,
    roles: ["super_admin", "admin", "cashier", "chef"],
  },
  {
    label: "Tables",
    href: "/admin/tables",
    icon: QrCode,
    roles: ["super_admin", "admin", "cashier"],
  },
  {
    label: "Stock",
    href: "/admin/stock",
    icon: Package,
    roles: ["super_admin", "admin", "cashier", "chef"],
  },
  {
    label: "Rapports",
    href: "/admin/reports",
    icon: BarChart3,
    roles: ["super_admin", "admin", "cashier"],
  },
  {
    label: "Menu",
    href: "/admin/menu",
    icon: UtensilsCrossed,
    roles: ["super_admin", "admin", "cashier", "chef"],
  },
  {
    label: "Galerie",
    href: "/admin/gallery",
    icon: Image,
    roles: ["super_admin", "admin"],
  },
  {
    label: "Avis",
    href: "/admin/reviews",
    icon: MessageSquare,
    roles: ["super_admin", "admin"],
  },
  {
    label: "Utilisateurs",
    href: "/admin/users",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    label: "Parametres",
    href: "/admin/settings",
    icon: Settings,
    roles: ["super_admin", "admin"],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { role, profile, isLoading } = useCurrentUser();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <BrandLogo size="sm" />
        <span className="font-display text-lg font-bold">Admin</span>
      </div>

      {/* User info */}
      <div className="border-b px-4 py-3">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Chargement...</span>
          </div>
        ) : profile ? (
          <div className="space-y-1">
            <p className="text-sm font-medium truncate">{profile.full_name || "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground">
              {role ? ROLE_LABELS[role] : ""}
            </p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/"
          prefetch={true}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="size-5" />
          Retour au site
        </Link>
      </div>
    </aside>
  );
}
