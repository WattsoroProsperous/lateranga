"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { DailySummary } from "@/types";

export interface DailyRevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface DailyProfitData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
  profitMargin: number;
}

export interface ItemProfitData {
  itemId: string;
  itemName: string;
  categoryName: string;
  salePrice: number;
  costPrice: number;
  profit: number;
  profitMargin: number;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface PeakHourData {
  hour: number;
  totalOrders: number;
  avgOrdersPerDay: number;
}

export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalOrders: number;
  averageOrderValue: number;
  averageProfit: number;
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

// ============================================
// Profit Analytics
// ============================================

export async function getDailyProfit(days: number = 30): Promise<DailyProfitData[]> {
  const supabase = createAdminClient();

  // First check daily_summaries table
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: summaries } = await supabase
    .from("daily_summaries")
    .select("*")
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (summaries && summaries.length > 0) {
    return (summaries as DailySummary[]).map(s => ({
      date: s.date,
      revenue: s.total_revenue,
      cost: s.total_cost,
      profit: s.total_profit,
      orders: s.total_orders,
      profitMargin: s.total_revenue > 0
        ? Math.round((s.total_profit / s.total_revenue) * 100 * 100) / 100
        : 0,
    }));
  }

  // Fallback: calculate from orders with cost data
  const { data: orders } = await supabase
    .from("orders")
    .select("paid_at, total, total_cost, profit")
    .eq("payment_status", "paid")
    .is("deleted_at", null)
    .gte("paid_at", startDate.toISOString())
    .order("paid_at");

  if (!orders) return [];

  const byDate: Record<string, { revenue: number; cost: number; orders: number }> = {};

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0];
    byDate[key] = { revenue: 0, cost: 0, orders: 0 };
  }

  orders.forEach((order) => {
    if (!order.paid_at) return;
    const date = order.paid_at.split("T")[0];
    if (byDate[date]) {
      byDate[date].revenue += order.total ?? 0;
      byDate[date].cost += order.total_cost ?? 0;
      byDate[date].orders += 1;
    }
  });

  return Object.entries(byDate).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    cost: data.cost,
    profit: data.revenue - data.cost,
    orders: data.orders,
    profitMargin: data.revenue > 0
      ? Math.round(((data.revenue - data.cost) / data.revenue) * 100 * 100) / 100
      : 0,
  }));
}

export async function getProfitSummary(
  period: "day" | "week" | "month" = "month"
): Promise<ProfitSummary> {
  const supabase = createAdminClient();

  const days = period === "day" ? 1 : period === "week" ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from("orders")
    .select("total, total_cost, profit")
    .eq("payment_status", "paid")
    .is("deleted_at", null)
    .gte("paid_at", startDate.toISOString());

  if (!orders || orders.length === 0) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMargin: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      averageProfit: 0,
    };
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalCost = orders.reduce((sum, o) => sum + (o.total_cost ?? 0), 0);
  const totalProfit = totalRevenue - totalCost;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100 * 100) / 100 : 0,
    totalOrders: orders.length,
    averageOrderValue: Math.round(totalRevenue / orders.length),
    averageProfit: Math.round(totalProfit / orders.length),
  };
}

export async function getItemProfitMargins(): Promise<ItemProfitData[]> {
  const supabase = createAdminClient();

  // Get menu items with their categories
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select(`
      id,
      name,
      price,
      category:menu_categories(id, name, tab)
    `)
    .eq("is_available", true);

  if (!menuItems) return [];

  // Get stock items cost (beverages/desserts)
  const { data: stockItems } = await supabase
    .from("stock_items")
    .select("menu_item_id, cost_per_unit")
    .eq("is_active", true);

  const stockCostMap = new Map(
    (stockItems ?? []).map(s => [s.menu_item_id, s.cost_per_unit])
  );

  // Get recipe costs (dishes)
  const { data: recipeIngredients } = await supabase
    .from("recipe_ingredients")
    .select(`
      menu_item_id,
      quantity_used,
      ingredient:ingredients(price_per_unit)
    `);

  const recipeCostMap = new Map<string, number>();
  (recipeIngredients ?? []).forEach(ri => {
    const currentCost = recipeCostMap.get(ri.menu_item_id) ?? 0;
    const ingredientCost = ri.quantity_used * ((ri.ingredient as { price_per_unit: number })?.price_per_unit ?? 0);
    recipeCostMap.set(ri.menu_item_id, currentCost + ingredientCost);
  });

  // Get sales data
  const { data: salesData } = await supabase
    .from("order_items")
    .select(`
      menu_item_id,
      quantity,
      line_total,
      order:orders!inner(payment_status, deleted_at)
    `)
    .eq("orders.payment_status", "paid")
    .is("orders.deleted_at", null)
    .not("menu_item_id", "is", null);

  const salesMap = new Map<string, { qty: number; revenue: number }>();
  (salesData ?? []).forEach(sale => {
    if (!sale.menu_item_id) return;
    const current = salesMap.get(sale.menu_item_id) ?? { qty: 0, revenue: 0 };
    salesMap.set(sale.menu_item_id, {
      qty: current.qty + sale.quantity,
      revenue: current.revenue + (sale.line_total ?? 0),
    });
  });

  // Build result
  const result: ItemProfitData[] = menuItems.map(item => {
    const category = item.category as { id: string; name: string; tab: string } | null;
    const costPrice = stockCostMap.get(item.id) ?? recipeCostMap.get(item.id) ?? 0;
    const profit = item.price - costPrice;
    const sales = salesMap.get(item.id) ?? { qty: 0, revenue: 0 };

    return {
      itemId: item.id,
      itemName: item.name,
      categoryName: category?.name ?? "Sans categorie",
      salePrice: item.price,
      costPrice: Math.round(costPrice),
      profit,
      profitMargin: item.price > 0 ? Math.round((profit / item.price) * 100 * 100) / 100 : 0,
      totalSold: sales.qty,
      totalRevenue: sales.revenue,
      totalProfit: sales.qty * profit,
    };
  });

  return result.sort((a, b) => b.totalProfit - a.totalProfit);
}

export async function getPeakHoursAnalysis(days: number = 30): Promise<PeakHourData[]> {
  const supabase = createAdminClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: orders } = await supabase
    .from("orders")
    .select("paid_at")
    .eq("payment_status", "paid")
    .is("deleted_at", null)
    .gte("paid_at", startDate.toISOString());

  if (!orders) return [];

  // Count orders by hour
  const hourCounts: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourCounts[h] = 0;

  orders.forEach(order => {
    if (!order.paid_at) return;
    const hour = new Date(order.paid_at).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  });

  return Object.entries(hourCounts).map(([hour, count]) => ({
    hour: parseInt(hour),
    totalOrders: count,
    avgOrdersPerDay: Math.round((count / days) * 100) / 100,
  }));
}

export async function getTrendAnalysis(weeks: number = 4) {
  const supabase = createAdminClient();

  const result: Array<{
    week: number;
    startDate: string;
    endDate: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
    avgOrderValue: number;
  }> = [];

  for (let w = 0; w < weeks; w++) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - (w * 7));
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const { data: orders } = await supabase
      .from("orders")
      .select("total, total_cost, profit")
      .eq("payment_status", "paid")
      .is("deleted_at", null)
      .gte("paid_at", startDate.toISOString())
      .lte("paid_at", endDate.toISOString());

    const revenue = (orders ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0);
    const cost = (orders ?? []).reduce((sum, o) => sum + (o.total_cost ?? 0), 0);
    const ordersCount = (orders ?? []).length;

    result.push({
      week: w + 1,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      revenue,
      cost,
      profit: revenue - cost,
      orders: ordersCount,
      avgOrderValue: ordersCount > 0 ? Math.round(revenue / ordersCount) : 0,
    });
  }

  return result.reverse(); // Oldest first
}

// ============================================
// Export Data Preparation
// ============================================

export interface ExportData {
  summary: ProfitSummary;
  dailyData: DailyProfitData[];
  topItems: ItemProfitData[];
  peakHours: PeakHourData[];
  trends: Awaited<ReturnType<typeof getTrendAnalysis>>;
}

export async function getExportData(days: number = 30): Promise<ExportData> {
  const [summary, dailyData, topItems, peakHours, trends] = await Promise.all([
    getProfitSummary(days <= 1 ? "day" : days <= 7 ? "week" : "month"),
    getDailyProfit(days),
    getItemProfitMargins(),
    getPeakHoursAnalysis(days),
    getTrendAnalysis(4),
  ]);

  return {
    summary,
    dailyData,
    topItems: topItems.slice(0, 20), // Top 20 items
    peakHours,
    trends,
  };
}
