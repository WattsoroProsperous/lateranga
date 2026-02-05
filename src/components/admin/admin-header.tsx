"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/store/theme-toggle";
import { AdminSidebar } from "./admin-sidebar";
import { OrderNotifications } from "./order-notifications";
import {
  Menu,
  LogOut,
  X,
} from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pos": "Caisse",
  "/admin/orders": "Commandes",
  "/admin/reports": "Rapports",
  "/admin/menu": "Menu",
  "/admin/gallery": "Galerie",
  "/admin/reviews": "Avis",
};

export function AdminHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = Object.entries(pageTitles).find(([path]) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path)
  )?.[1] ?? "Admin";

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <OrderNotifications />
          <ThemeToggle />
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit">
              <LogOut className="size-5" />
            </Button>
          </form>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-background shadow-xl">
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <AdminSidebar />
          </div>
        </div>
      )}
    </>
  );
}
