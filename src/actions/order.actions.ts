"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isCurrentUserAdmin } from "@/lib/supabase/admin";
import { createOrderSchema, updateOrderStatusSchema } from "@/lib/validations/order.schema";
import { revalidatePath } from "next/cache";
import type { Order } from "@/types";

export async function createOrder(input: unknown) {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();
  const data = parsed.data;

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const deliveryFee = data.order_type === "livraison" ? 1000 : 0;
  const total = subtotal + deliveryFee;

  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: "",
      customer_id: user?.id ?? null,
      status: "pending" as const,
      order_type: data.order_type,
      client_name: data.client_name,
      client_phone: data.client_phone,
      delivery_address: data.delivery_address ?? null,
      notes: data.notes ?? null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
    } as never)
    .select()
    .single();

  const order = orderData as Order | null;

  if (orderError || !order) {
    return { error: orderError?.message ?? "Erreur lors de la creation de la commande" };
  }

  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    menu_item_id: null as string | null,
    item_name: item.name,
    item_price: item.price,
    quantity: item.qty,
    line_total: item.price * item.qty,
    size_variant: item.sizeVariant ?? null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems as never);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "Erreur lors de l'ajout des articles" };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true, orderNumber: order.order_number };
}

export async function createPOSOrder(input: unknown) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();
  const data = parsed.data;

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const total = subtotal;

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: "",
      customer_id: null,
      status: "completed" as const,
      order_type: "sur_place" as const,
      client_name: data.client_name,
      client_phone: data.client_phone,
      delivery_address: null,
      notes: null,
      subtotal,
      delivery_fee: 0,
      total,
      completed_at: new Date().toISOString(),
    } as never)
    .select()
    .single();

  const order = orderData as Order | null;

  if (orderError || !order) {
    return { error: orderError?.message ?? "Erreur lors de la creation de la commande" };
  }

  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    menu_item_id: null as string | null,
    item_name: item.name,
    item_price: item.price,
    quantity: item.qty,
    line_total: item.price * item.qty,
    size_variant: item.sizeVariant ?? null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems as never);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "Erreur lors de l'ajout des articles" };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/pos");
  revalidatePath("/admin/reports");
  return { success: true, orderNumber: order.order_number };
}

export async function updateOrderStatus(input: unknown) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();
  const updateData: Record<string, unknown> = { status: parsed.data.status };

  if (parsed.data.status === "cancelled" && parsed.data.cancellation_reason) {
    updateData.cancellation_reason = parsed.data.cancellation_reason;
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData as never)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true };
}

export async function getOrderAnalytics() {
  const supabase = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayRes, weekRes, monthRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", today.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .neq("status", "cancelled"),
  ]);

  type TotalRow = { total: number | null };
  const todayData = (todayRes.data ?? []) as TotalRow[];
  const weekData = (weekRes.data ?? []) as TotalRow[];
  const monthData = (monthRes.data ?? []) as TotalRow[];

  return {
    today: {
      count: todayData.length,
      revenue: todayData.reduce((s, o) => s + (o.total ?? 0), 0),
    },
    week: {
      count: weekData.length,
      revenue: weekData.reduce((s, o) => s + (o.total ?? 0), 0),
    },
    month: {
      count: monthData.length,
      revenue: monthData.reduce((s, o) => s + (o.total ?? 0), 0),
    },
  };
}

export async function getOrders(status?: string) {
  const supabase = createAdminClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status as "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled");
  }

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data: data as Order[] };
}

export async function getOrderById(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data: data as Order };
}
