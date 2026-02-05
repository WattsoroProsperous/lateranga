"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface DailyRevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface PopularItemData {
  name: string;
  quantity: number;
  revenue: number;
}

export interface OrderTypeData {
  type: string;
  count: number;
  revenue: number;
}

export interface ReportsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
}

export async function getDailyRevenue(days: number = 30): Promise<DailyRevenueData[]> {
  const supabase = createAdminClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from("orders")
    .select("created_at, total, status")
    .gte("created_at", startDate.toISOString())
    .neq("status", "cancelled")
    .order("created_at");

  if (!orders) return [];

  const byDate: Record<string, { revenue: number; orders: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0];
    byDate[key] = { revenue: 0, orders: 0 };
  }

  orders.forEach((order) => {
    const date = order.created_at.split("T")[0];
    if (byDate[date]) {
      byDate[date].revenue += order.total ?? 0;
      byDate[date].orders += 1;
    }
  });

  return Object.entries(byDate).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }));
}

export async function getPopularItems(limit: number = 10): Promise<PopularItemData[]> {
  const supabase = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      item_name,
      quantity,
      line_total,
      order:orders!inner(status, created_at)
    `)
    .gte("orders.created_at", thirtyDaysAgo.toISOString())
    .neq("orders.status", "cancelled");

  if (!orderItems) return [];

  const byItem: Record<string, { quantity: number; revenue: number }> = {};

  orderItems.forEach((item) => {
    const name = item.item_name;
    if (!byItem[name]) {
      byItem[name] = { quantity: 0, revenue: 0 };
    }
    byItem[name].quantity += item.quantity;
    byItem[name].revenue += item.line_total ?? 0;
  });

  return Object.entries(byItem)
    .map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export async function getOrderTypesDistribution(): Promise<OrderTypeData[]> {
  const supabase = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("order_type, total")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .neq("status", "cancelled");

  if (!orders) return [];

  const byType: Record<string, { count: number; revenue: number }> = {
    sur_place: { count: 0, revenue: 0 },
    emporter: { count: 0, revenue: 0 },
    livraison: { count: 0, revenue: 0 },
  };

  orders.forEach((order) => {
    const type = order.order_type;
    if (byType[type]) {
      byType[type].count += 1;
      byType[type].revenue += order.total ?? 0;
    }
  });

  const typeLabels: Record<string, string> = {
    sur_place: "Sur place",
    emporter: "A emporter",
    livraison: "Livraison",
  };

  return Object.entries(byType).map(([type, data]) => ({
    type: typeLabels[type] ?? type,
    count: data.count,
    revenue: data.revenue,
  }));
}

export async function getReportsSummary(
  period: "day" | "week" | "month" = "month"
): Promise<ReportsSummary> {
  const supabase = createAdminClient();

  const days = period === "day" ? 1 : period === "week" ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from("orders")
    .select("total, status")
    .gte("created_at", startDate.toISOString());

  if (!orders) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      completedOrders: 0,
      pendingOrders: 0,
    };
  }

  const validOrders = orders.filter((o) => o.status !== "cancelled");
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing"
  ).length;

  return {
    totalRevenue,
    totalOrders: validOrders.length,
    averageOrderValue: validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0,
    completedOrders,
    pendingOrders,
  };
}
