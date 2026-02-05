import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { Card } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Admin La Teranga",
};

interface OrderTotal {
  total: number | null;
}

interface RecentOrder {
  id: string;
  order_number: string;
  client_name: string;
  status: string;
  total: number | null;
  created_at: string;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Fetch stats in parallel
  const [todayOrdersRes, pendingRes, completedRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", todayISO),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed", "preparing"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  const todayOrders = (todayOrdersRes.data ?? []) as OrderTotal[];
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  const stats = {
    todayOrders: todayOrders.length,
    todayRevenue,
    pendingOrders: pendingRes.count ?? 0,
    completedOrders: completedRes.count ?? 0,
  };

  // Fetch recent orders
  const { data: recentData } = await supabase
    .from("orders")
    .select("id, order_number, client_name, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentOrders = (recentData ?? []) as RecentOrder[];

  return (
    <div className="space-y-6">
      <DashboardStats stats={stats} />

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold mb-4">
          Commandes récentes
        </h2>
        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.client_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {(order.total ?? 0).toLocaleString("fr-CI")} F
                  </p>
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune commande récente
          </p>
        )}
      </Card>
    </div>
  );
}
