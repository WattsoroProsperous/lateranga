import { createAdminClient } from "@/lib/supabase/admin";
import { POSInterface } from "@/components/admin/pos-interface";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caisse | Admin La Teranga",
};

interface MenuItem {
  id: string;
  name: string;
  price: number;
  price_small: number | null;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  tab: string;
  items: MenuItem[];
}

export default async function POSPage() {
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("menu_categories")
    .select(`
      id,
      name,
      slug,
      tab,
      items:menu_items(id, name, price, price_small, is_available)
    `)
    .eq("is_active", true)
    .order("sort_order");

  return <POSInterface categories={(categories as Category[]) ?? []} />;
}
