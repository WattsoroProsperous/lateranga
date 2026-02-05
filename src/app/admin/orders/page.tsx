import { createAdminClient } from "@/lib/supabase/admin";
import { OrdersTable } from "@/components/admin/orders-table";
import type { Order } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commandes | Admin La Teranga",
};

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return <OrdersTable orders={(data ?? []) as Order[]} />;
}
