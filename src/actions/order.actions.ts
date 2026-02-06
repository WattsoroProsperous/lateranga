"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isCurrentUserAdmin, canValidatePayments, hasRole, getCurrentUserProfile, getCurrentUserRole } from "@/lib/supabase/admin";
import { createOrderSchema, updateOrderStatusSchema } from "@/lib/validations/order.schema";
import { PERMISSIONS, MANAGER_ROLES } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import type { Order, AuditActionType } from "@/types";

// ============================================
// Audit Logging Helper
// ============================================

async function createAuditLog(params: {
  actionType: AuditActionType;
  orderId: string;
  orderNumber: string;
  orderData: Record<string, unknown>;
  reason: string;
  changes?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const profile = await getCurrentUserProfile();
  const role = await getCurrentUserRole();

  if (!profile || !role) {
    console.error("[Audit] No profile found for audit log");
    return;
  }

  const { error } = await supabase
    .from("order_audit_log")
    .insert({
      action_type: params.actionType,
      actor_id: profile.id,
      actor_role: role,
      actor_name: profile.full_name,
      order_id: params.orderId,
      order_number: params.orderNumber,
      order_data: params.orderData,
      reason: params.reason,
      changes: params.changes ?? null,
    } as never);

  if (error) {
    console.error("[Audit] Error creating audit log:", error);
  }
}

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
  // POS requires payment validation permission (cashier, admin, super_admin)
  const canPay = await canValidatePayments();
  if (!canPay) {
    return { error: "Non autorise - Seuls les caissiers et administrateurs peuvent enregistrer des ventes" };
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
  const now = new Date().toISOString();

  // POS orders are immediately completed and paid
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
      payment_status: "paid" as const,
      paid_at: now,
      completed_at: now,
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
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const newStatus = parsed.data.status;

  // "completed" status can only be set via payment validation (markOrderAsPaid)
  // This ensures orders are only completed when they are paid
  if (newStatus === "completed") {
    return { error: "Le statut 'completed' ne peut etre defini que via l'encaissement" };
  }

  const supabase = createAdminClient();
  const currentRole = await getCurrentUserRole();

  // Get order to check type
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", parsed.data.id)
    .single();

  if (!order) {
    return { error: "Commande non trouvee" };
  }

  // Check permissions based on status
  if (newStatus === "cancelled") {
    const canCancel = await hasRole(PERMISSIONS.ORDERS_CANCEL);
    if (!canCancel) {
      return { error: "Non autorise - Vous ne pouvez pas annuler cette commande" };
    }

    // Chef can ONLY cancel table orders (QR code orders with ingredients issues)
    // Admin/super_admin can cancel any order
    if (currentRole === "chef") {
      // Check if order is from a table (QR code order)
      if (!order.table_id) {
        return { error: "Non autorise - Le chef ne peut annuler que les commandes de table (ingredients epuises)" };
      }
      // Reason is mandatory for chef cancellation
      if (!parsed.data.cancellation_reason) {
        return { error: "Motif obligatoire - Veuillez indiquer la raison (ex: ingredients epuises)" };
      }
    }

    // Create audit log for cancellation
    await createAuditLog({
      actionType: "cancel",
      orderId: order.id,
      orderNumber: order.order_number,
      orderData: order as unknown as Record<string, unknown>,
      reason: parsed.data.cancellation_reason ?? "Non specifie",
    });
  } else {
    const canManage = await hasRole(PERMISSIONS.ORDERS_MANAGE);
    if (!canManage) {
      return { error: "Non autorise" };
    }
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "cancelled") {
    updateData.cancellation_reason = parsed.data.cancellation_reason;
    updateData.cancelled_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData as never)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/kitchen");
  return { success: true };
}

export async function getOrderAnalytics() {
  const supabase = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Exclude cancelled AND deleted orders from analytics
  const [todayRes, weekRes, monthRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", today.toISOString())
      .neq("status", "cancelled")
      .is("deleted_at", null),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .neq("status", "cancelled")
      .is("deleted_at", null),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .neq("status", "cancelled")
      .is("deleted_at", null),
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

export async function getOrders(status?: string, includeDeleted = false) {
  const supabase = createAdminClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  // Exclude soft-deleted orders by default
  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

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

// Create order from table (QR code ordering)
export async function createTableOrder(input: {
  table_id: string;
  table_session_id: string;
  client_name: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
    sizeVariant?: "petit" | "grand";
  }>;
}) {
  const supabase = createAdminClient();

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // Create order linked to table
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: "",
      customer_id: null,
      status: "pending" as const,
      order_type: "sur_place" as const,
      client_name: input.client_name,
      client_phone: "0000000000", // Table orders don't need phone
      delivery_address: null,
      notes: null,
      subtotal,
      delivery_fee: 0,
      total: subtotal,
      table_id: input.table_id,
      table_session_id: input.table_session_id,
      payment_status: "pending" as const,
    } as never)
    .select()
    .single();

  const order = orderData as Order | null;

  if (orderError || !order) {
    console.error("Error creating table order:", orderError);
    return { error: orderError?.message ?? "Erreur lors de la creation de la commande" };
  }

  // Add order items - item.id is now the original menu_item UUID
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id,
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
    // Rollback order
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "Erreur lors de l'ajout des articles" };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin/tables");
  return { success: true, orderNumber: order.order_number };
}

// Get orders for a table session (customer order history)
export async function getSessionOrders(sessionId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      total,
      created_at,
      payment_status,
      order_items (
        id,
        item_name,
        item_price,
        quantity,
        line_total,
        size_variant
      )
    `)
    .eq("table_session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching session orders:", error);
    return { error: error.message };
  }

  return { data };
}

// Check if all orders in a session are paid or cancelled, and close the session
async function closeSessionIfAllPaid(sessionId: string): Promise<boolean> {
  const supabase = createAdminClient();

  // Get all orders for this session
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, payment_status, status")
    .eq("table_session_id", sessionId);

  if (error || !orders || orders.length === 0) {
    return false;
  }

  // Check if all orders are either paid or cancelled
  const allPaidOrCancelled = orders.every(
    (order) => order.payment_status === "paid" || order.status === "cancelled"
  );

  if (allPaidOrCancelled) {
    // Close the session
    const { error: closeError } = await supabase
      .from("table_sessions")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (closeError) {
      console.error("Error closing session:", closeError);
      return false;
    }

    console.log(`[closeSessionIfAllPaid] Session ${sessionId} closed - all orders paid`);
    return true;
  }

  return false;
}

// Mark order as paid and completed (for cashier/admin only)
// This is the ONLY way to mark an order as "completed"
// Business rule: payment_status=paid => status=completed
export async function markOrderAsPaid(orderId: string) {
  // Only cashiers and admins can validate payments
  const canPay = await canValidatePayments();
  if (!canPay) {
    return { error: "Non autorise - Seuls les caissiers et administrateurs peuvent encaisser" };
  }

  const supabase = createAdminClient();

  // Get order to check session and current status
  const { data: orderBefore } = await supabase
    .from("orders")
    .select("table_session_id, status, payment_status")
    .eq("id", orderId)
    .single();

  if (!orderBefore) {
    return { error: "Commande non trouvee" };
  }

  // Don't allow paying cancelled orders
  if (orderBefore.status === "cancelled") {
    return { error: "Impossible d'encaisser une commande annulee" };
  }

  // Don't allow double payment
  if (orderBefore.payment_status === "paid") {
    return { error: "Cette commande est deja payee" };
  }

  const now = new Date().toISOString();

  // Mark as paid AND completed simultaneously
  // This is the core business rule: encaissement = completion
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: now,
      status: "completed",
      completed_at: now,
    } as never)
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error marking order as paid:", error);
    return { error: error.message };
  }

  // Check if all orders in session are paid and close session if so
  let sessionClosed = false;
  if (orderBefore.table_session_id) {
    sessionClosed = await closeSessionIfAllPaid(orderBefore.table_session_id);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/tables");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin");

  return { success: true, data, sessionClosed };
}

// Get full order details with items (for receipt)
export async function getOrderWithItems(orderId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        item_name,
        item_price,
        quantity,
        line_total,
        size_variant
      ),
      restaurant_tables (
        name,
        table_number
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching order with items:", error);
    return { error: error.message };
  }

  return { data };
}

// Get pending orders count (for dashboard notifications)
export async function getPendingOrdersCount() {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  return { count: count ?? 0 };
}

// ============================================
// Admin-Only Order Management (with Audit)
// ============================================

// Soft delete an order (admin/super_admin only)
// This marks the order as deleted but keeps it for audit trail
export async function deleteOrder(orderId: string, reason: string) {
  // Only admin and super_admin can delete orders
  const canDelete = await hasRole(MANAGER_ROLES);
  if (!canDelete) {
    return { error: "Non autorise - Seuls les administrateurs peuvent supprimer des commandes" };
  }

  if (!reason || reason.trim().length < 5) {
    return { error: "Motif obligatoire (minimum 5 caracteres)" };
  }

  const supabase = createAdminClient();
  const profile = await getCurrentUserProfile();

  // Get full order data before deletion for audit
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { error: "Commande non trouvee" };
  }

  // Check if already deleted
  if (order.deleted_at) {
    return { error: "Cette commande est deja supprimee" };
  }

  // Create audit log BEFORE soft delete
  await createAuditLog({
    actionType: "delete",
    orderId: order.id,
    orderNumber: order.order_number,
    orderData: order as unknown as Record<string, unknown>,
    reason: reason.trim(),
  });

  // Soft delete the order
  const { error } = await supabase
    .from("orders")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: profile?.id,
      deletion_reason: reason.trim(),
    } as never)
    .eq("id", orderId);

  if (error) {
    console.error("Error deleting order:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");

  return { success: true };
}

// Modify a paid order (admin/super_admin only) - for error corrections
export async function modifyPaidOrder(
  orderId: string,
  reason: string,
  updates: {
    items?: Array<{
      id?: string; // Existing item ID to modify, or undefined for new
      item_name: string;
      item_price: number;
      quantity: number;
      delete?: boolean; // Set to true to remove this item
    }>;
    notes?: string;
  }
) {
  // Only admin and super_admin can modify paid orders
  const canModify = await hasRole(MANAGER_ROLES);
  if (!canModify) {
    return { error: "Non autorise - Seuls les administrateurs peuvent modifier des commandes payees" };
  }

  if (!reason || reason.trim().length < 5) {
    return { error: "Motif obligatoire pour la modification (minimum 5 caracteres)" };
  }

  const supabase = createAdminClient();

  // Get full order data before modification for audit
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { error: "Commande non trouvee" };
  }

  if (order.deleted_at) {
    return { error: "Impossible de modifier une commande supprimee" };
  }

  // Track changes for audit
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  // Handle item modifications if provided
  if (updates.items && updates.items.length > 0) {
    const oldItems = order.order_items;

    for (const item of updates.items) {
      if (item.delete && item.id) {
        // Delete existing item
        await supabase.from("order_items").delete().eq("id", item.id);
      } else if (item.id) {
        // Update existing item
        await supabase
          .from("order_items")
          .update({
            item_name: item.item_name,
            item_price: item.item_price,
            quantity: item.quantity,
            line_total: item.item_price * item.quantity,
          } as never)
          .eq("id", item.id);
      } else {
        // Add new item
        await supabase.from("order_items").insert({
          order_id: orderId,
          item_name: item.item_name,
          item_price: item.item_price,
          quantity: item.quantity,
          line_total: item.item_price * item.quantity,
        } as never);
      }
    }

    // Get updated items for comparison
    const { data: newItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    changes.items = { old: oldItems, new: newItems };

    // Recalculate totals
    const newSubtotal = (newItems ?? []).reduce(
      (sum, item) => sum + (item.line_total ?? 0),
      0
    );
    const newTotal = newSubtotal + (order.delivery_fee ?? 0);

    if (newSubtotal !== order.subtotal) {
      changes.subtotal = { old: order.subtotal, new: newSubtotal };
      changes.total = { old: order.total, new: newTotal };

      await supabase
        .from("orders")
        .update({ subtotal: newSubtotal, total: newTotal } as never)
        .eq("id", orderId);
    }
  }

  // Handle notes update if provided
  if (updates.notes !== undefined && updates.notes !== order.notes) {
    changes.notes = { old: order.notes, new: updates.notes };
    await supabase
      .from("orders")
      .update({ notes: updates.notes } as never)
      .eq("id", orderId);
  }

  // Create audit log with detailed changes
  await createAuditLog({
    actionType: "modify",
    orderId: order.id,
    orderNumber: order.order_number,
    orderData: order as unknown as Record<string, unknown>,
    reason: reason.trim(),
    changes,
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");

  return { success: true, changes };
}

// Get audit log for orders (admin only)
export async function getOrderAuditLog(orderId?: string) {
  const canView = await hasRole(MANAGER_ROLES);
  if (!canView) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("order_audit_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (orderId) {
    query = query.eq("order_id", orderId);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return { error: error.message };
  }

  return { data };
}

// Get all audit logs for security review (admin only)
export async function getAllAuditLogs(filters?: {
  actionType?: AuditActionType;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const canView = await hasRole(MANAGER_ROLES);
  if (!canView) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("order_audit_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.actionType) {
    query = query.eq("action_type", filters.actionType);
  }
  if (filters?.actorId) {
    query = query.eq("actor_id", filters.actorId);
  }
  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query.limit(500);

  if (error) {
    return { error: error.message };
  }

  return { data };
}
