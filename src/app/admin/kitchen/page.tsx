import { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { KitchenBoard } from "@/components/admin/kitchen-board";
import type { Order, OrderItem } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Cuisine | La Teranga Admin",
};

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  restaurant_tables?: { name: string } | null;
}

export default async function KitchenPage() {
  const supabase = createAdminClient();

  // Get orders that are relevant to kitchen
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*),
      restaurant_tables (name)
    `)
    .in("status", ["pending", "confirmed", "preparing", "ready"])
    .order("created_at", { ascending: true });

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <KitchenBoard initialOrders={(orders as OrderWithItems[]) ?? []} />
    </div>
  );
}
