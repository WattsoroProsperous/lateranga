import { createAdminClient } from "@/lib/supabase/admin";
import { MenuItemsTable } from "@/components/admin/menu-items-table";
import type { MenuItem } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu | Admin La Teranga",
};

export default async function AdminMenuPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .order("sort_order", { ascending: true });

  return <MenuItemsTable items={(data ?? []) as MenuItem[]} />;
}
