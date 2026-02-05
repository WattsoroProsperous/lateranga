"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/store/brand-logo";
import {
  LayoutDashboard,
  Calculator,
  ShoppingBag,
  BarChart3,
  UtensilsCrossed,
  Image,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Caisse (POS)",
    href: "/admin/pos",
    icon: Calculator,
  },
  {
    label: "Commandes",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Rapports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Menu",
    href: "/admin/menu",
    icon: UtensilsCrossed,
  },
  {
    label: "Galerie",
    href: "/admin/gallery",
    icon: Image,
  },
  {
    label: "Avis",
    href: "/admin/reviews",
    icon: MessageSquare,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <BrandLogo size="sm" />
        <span className="font-display text-lg font-bold">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
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
