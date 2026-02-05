import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { Card } from "@/components/ui/card";
import Link from "next/link";
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

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  preparing: "En preparation",
  ready: "Prete",
  delivering: "En livraison",
  completed: "Terminee",
  cancelled: "Annulee",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  delivering: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">
            Commandes recentes
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:underline"
          >
            Voir tout
          </Link>
        </div>
        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
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
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune commande recente
          </p>
        )}
      </Card>
    </div>
  );
}
