"use server";

import { createAdminClient, isCurrentUserAdmin, hasRole, getCurrentUserRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createStockItemSchema,
  updateStockItemSchema,
  createIngredientSchema,
  updateIngredientSchema,
  createRecipeIngredientSchema,
  updateRecipeIngredientSchema,
  createIngredientRequestSchema,
  updateIngredientRequestSchema,
  stockAdjustmentSchema,
} from "@/lib/validations/stock.schema";
import { revalidatePath } from "next/cache";
import type { StockItem, Ingredient, RecipeIngredient, IngredientRequest, StockMovement, UserRole } from "@/types";

// ============================================
// Stock Items (Drinks/Desserts)
// ============================================

export async function getStockItems() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .order("name");

  if (error) return { error: error.message };
  return { data: data as StockItem[] };
}

export async function getStockItemById(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data: data as StockItem };
}

export async function createStockItem(input: unknown) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const parsed = createStockItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stock_items")
    .insert(parsed.data as never)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/stock");
  return { data: data as StockItem };
}

export async function updateStockItem(input: unknown) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const parsed = updateStockItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();
  const { id, ...updateData } = parsed.data;

  const { data, error } = await supabase
    .from("stock_items")
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/stock");
  return { data: data as StockItem };
}

export async function deleteStockItem(id: string) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stock_items")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/stock");
  return { success: true };
}

// ============================================
// Ingredients
// ============================================

export async function getIngredients() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("name");

  if (error) return { error: error.message };
  return { data: data as Ingredient[] };
}

export async function getIngredientById(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data: data as Ingredient };
}

export async function createIngredient(input: unknown) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const parsed = createIngredientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ingredients")
    .insert(parsed.data as never)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/stock/ingredients");
  return { data: data as Ingredient };
}

export async function updateIngredient(input: unknown) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const parsed = updateIngredientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();
  const { id, ...updateData } = parsed.data;

  const { data, error } = await supabase
    .from("ingredients")
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/stock/ingredients");
  return { data: data as Ingredient };
}

export async function deleteIngredient(id: string) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ingredients")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/stock/ingredients");
  return { success: true };
}

// ============================================
// Recipe Ingredients
// ============================================

export async function getRecipeIngredients(menuItemId?: string) {
  const supabase = createAdminClient();

  let query = supabase
    .from("recipe_ingredients")
    .select(`
      *,
      ingredient:ingredients(id, name, unit, price_per_unit),
      menu_item:menu_items(id, name)
    `);

  if (menuItemId) {
    query = query.eq("menu_item_id", menuItemId);
  }

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data };
}

export async function createRecipeIngredient(input: unknown) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const parsed = createRecipeIngredientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("recipe_ingredients")
    .insert(parsed.data as never)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Cet ingredient est deja dans la recette" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/stock/recipes");
  return { data: data as RecipeIngredient };
}

export async function updateRecipeIngredient(input: unknown) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const parsed = updateRecipeIngredientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();
  const { id, ...updateData } = parsed.data;

  const { data, error } = await supabase
    .from("recipe_ingredients")
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/stock/recipes");
  return { data: data as RecipeIngredient };
}

export async function deleteRecipeIngredient(id: string) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/stock/recipes");
  return { success: true };
}

// ============================================
// Ingredient Requests (Chef)
// ============================================

export async function getIngredientRequests(status?: string) {
  const supabase = createAdminClient();

  let query = supabase
    .from("ingredient_requests")
    .select(`
      *,
      ingredient:ingredients(id, name, unit, current_quantity)
    `)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status as "pending" | "approved" | "rejected");
  }

  const { data, error } = await query;

  if (error) return { error: error.message };

  // Fetch user names separately to avoid FK issues
  if (data && data.length > 0) {
    const userIds = [...new Set([
      ...data.map(r => r.requested_by),
      ...data.filter(r => r.approved_by).map(r => r.approved_by)
    ].filter(Boolean))];

    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds as string[]);

    const userMap = new Map(users?.map(u => [u.id, u]) ?? []);

    const enrichedData = data.map(r => ({
      ...r,
      requested_by_user: r.requested_by ? userMap.get(r.requested_by) ?? null : null,
      approved_by_user: r.approved_by ? userMap.get(r.approved_by) ?? null : null,
    }));

    return { data: enrichedData };
  }

  return { data: data ?? [] };
}

export async function createIngredientRequest(input: unknown) {
  const canRequest = await hasRole(["super_admin", "admin", "chef"] as UserRole[]);
  if (!canRequest) return { error: "Non autorise" };

  const parsed = createIngredientRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Non authentifie" };

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ingredient_requests")
    .insert({
      ...parsed.data,
      requested_by: user.id,
    } as never)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/stock/requests");
  revalidatePath("/admin/kitchen");
  return { data: data as IngredientRequest };
}

export async function processIngredientRequest(input: unknown) {
  const canProcess = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canProcess) return { error: "Non autorise" };

  const parsed = updateIngredientRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Non authentifie" };

  const supabase = createAdminClient();

  // Get the request
  const { data: request, error: fetchError } = await supabase
    .from("ingredient_requests")
    .select("*, ingredient:ingredients(*)")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !request) {
    return { error: "Demande non trouvee" };
  }

  // Update request status
  const { error: updateError } = await supabase
    .from("ingredient_requests")
    .update({
      status: parsed.data.status,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    } as never)
    .eq("id", parsed.data.id);

  if (updateError) return { error: updateError.message };

  // If approved, deduct from stock
  if (parsed.data.status === "approved") {
    const ingredient = (request as { ingredient: Ingredient }).ingredient;
    const newQuantity = Math.max(0, ingredient.current_quantity - request.quantity);

    // Update ingredient quantity
    const { error: stockError } = await supabase
      .from("ingredients")
      .update({ current_quantity: newQuantity } as never)
      .eq("id", request.ingredient_id);

    if (stockError) return { error: stockError.message };

    // Record stock movement
    await supabase
      .from("stock_movements")
      .insert({
        ingredient_id: request.ingredient_id,
        movement_type: "request",
        quantity: -request.quantity,
        previous_quantity: ingredient.current_quantity,
        new_quantity: newQuantity,
        reference_id: request.id,
        note: `Demande approuvee`,
        performed_by: user.id,
      } as never);
  }

  revalidatePath("/admin/stock/requests");
  revalidatePath("/admin/stock/ingredients");
  return { success: true };
}

// ============================================
// Stock Adjustments
// ============================================

export async function adjustStock(input: unknown) {
  const canManage = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!canManage) return { error: "Non autorise" };

  const parsed = stockAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Non authentifie" };

  const supabase = createAdminClient();
  const { stock_item_id, ingredient_id, movement_type, quantity, note } = parsed.data;

  if (stock_item_id) {
    // Get current stock item
    const { data: item, error: fetchError } = await supabase
      .from("stock_items")
      .select("*")
      .eq("id", stock_item_id)
      .single();

    if (fetchError || !item) return { error: "Article non trouve" };

    const stockItem = item as StockItem;
    const newQuantity = movement_type === "restock"
      ? stockItem.current_quantity + quantity
      : movement_type === "waste"
      ? Math.max(0, stockItem.current_quantity - Math.abs(quantity))
      : stockItem.current_quantity + quantity; // adjustment can be + or -

    // Update stock
    const { error: updateError } = await supabase
      .from("stock_items")
      .update({ current_quantity: newQuantity } as never)
      .eq("id", stock_item_id);

    if (updateError) return { error: updateError.message };

    // Record movement
    await supabase
      .from("stock_movements")
      .insert({
        stock_item_id,
        movement_type,
        quantity: movement_type === "waste" ? -Math.abs(quantity) : quantity,
        previous_quantity: stockItem.current_quantity,
        new_quantity: newQuantity,
        note,
        performed_by: user.id,
      } as never);

    revalidatePath("/admin/stock");
  } else if (ingredient_id) {
    // Get current ingredient
    const { data: item, error: fetchError } = await supabase
      .from("ingredients")
      .select("*")
      .eq("id", ingredient_id)
      .single();

    if (fetchError || !item) return { error: "Ingredient non trouve" };

    const ingredient = item as Ingredient;
    const newQuantity = movement_type === "restock"
      ? ingredient.current_quantity + quantity
      : movement_type === "waste"
      ? Math.max(0, ingredient.current_quantity - Math.abs(quantity))
      : ingredient.current_quantity + quantity;

    // Update stock
    const { error: updateError } = await supabase
      .from("ingredients")
      .update({ current_quantity: newQuantity } as never)
      .eq("id", ingredient_id);

    if (updateError) return { error: updateError.message };

    // Record movement
    await supabase
      .from("stock_movements")
      .insert({
        ingredient_id,
        movement_type,
        quantity: movement_type === "waste" ? -Math.abs(quantity) : quantity,
        previous_quantity: ingredient.current_quantity,
        new_quantity: newQuantity,
        note,
        performed_by: user.id,
      } as never);

    revalidatePath("/admin/stock/ingredients");
  }

  return { success: true };
}

// ============================================
// Stock Movements History
// ============================================

export async function getStockMovements(filters?: {
  stock_item_id?: string;
  ingredient_id?: string;
  limit?: number;
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from("stock_movements")
    .select(`
      *,
      stock_item:stock_items(id, name),
      ingredient:ingredients(id, name),
      performed_by_user:profiles(id, full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 50);

  if (filters?.stock_item_id) {
    query = query.eq("stock_item_id", filters.stock_item_id);
  }

  if (filters?.ingredient_id) {
    query = query.eq("ingredient_id", filters.ingredient_id);
  }

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data: data as StockMovement[] };
}

// ============================================
// Stock Analytics
// ============================================

export async function getStockAnalytics() {
  const supabase = createAdminClient();

  const [stockItemsRes, ingredientsRes] = await Promise.all([
    supabase.from("stock_items").select("*").eq("is_active", true),
    supabase.from("ingredients").select("*").eq("is_active", true),
  ]);

  const stockItems = (stockItemsRes.data ?? []) as StockItem[];
  const ingredients = (ingredientsRes.data ?? []) as Ingredient[];

  const lowStockItems = stockItems.filter(
    (item) => item.current_quantity <= item.min_threshold
  );
  const lowStockIngredients = ingredients.filter(
    (item) => item.current_quantity <= item.min_threshold
  );

  const totalStockValue = stockItems.reduce(
    (sum, item) => sum + item.current_quantity * item.cost_per_unit,
    0
  );
  const totalIngredientValue = ingredients.reduce(
    (sum, item) => sum + item.current_quantity * item.price_per_unit,
    0
  );

  return {
    stockItems: {
      total: stockItems.length,
      lowStock: lowStockItems.length,
      items: lowStockItems,
      totalValue: totalStockValue,
    },
    ingredients: {
      total: ingredients.length,
      lowStock: lowStockIngredients.length,
      items: lowStockIngredients,
      totalValue: totalIngredientValue,
    },
    totalValue: totalStockValue + totalIngredientValue,
  };
}

// ============================================
// Decrement Stock on Order (for drinks/desserts)
// ============================================

export async function decrementStockForOrder(items: Array<{
  menu_item_id?: string | null;
  name: string;
  quantity: number;
}>) {
  const supabase = createAdminClient();

  for (const item of items) {
    if (!item.menu_item_id) continue;

    // Find stock item linked to this menu item
    const { data: stockItem } = await supabase
      .from("stock_items")
      .select("*")
      .eq("menu_item_id", item.menu_item_id)
      .single();

    if (stockItem) {
      const newQuantity = Math.max(0, (stockItem as StockItem).current_quantity - item.quantity);

      await supabase
        .from("stock_items")
        .update({ current_quantity: newQuantity } as never)
        .eq("id", (stockItem as StockItem).id);

      // Record movement
      await supabase
        .from("stock_movements")
        .insert({
          stock_item_id: (stockItem as StockItem).id,
          movement_type: "sale",
          quantity: -item.quantity,
          previous_quantity: (stockItem as StockItem).current_quantity,
          new_quantity: newQuantity,
          note: `Vente: ${item.name}`,
        } as never);
    }
  }

  revalidatePath("/admin/stock");
}

// ============================================
// Chef Immediate Withdrawal (No approval needed)
// ============================================

interface WithdrawResult {
  success: boolean;
  needs_approval?: boolean;
  request_id?: string;
  movement_id?: string;
  new_quantity?: number;
  message?: string;
  error?: string;
  available?: number;
}

export async function chefWithdrawIngredient(input: {
  ingredient_id: string;
  quantity: number;
  note?: string;
}): Promise<{ success?: boolean; needs_approval?: boolean; error?: string; message?: string; newQuantity?: number }> {
  // Chef, admin, and super_admin can withdraw ingredients
  const canWithdraw = await hasRole(["super_admin", "admin", "chef"] as UserRole[]);
  if (!canWithdraw) return { error: "Non autorise - Seuls le chef et les administrateurs peuvent retirer des ingredients" };

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Non authentifie" };

  const supabase = createAdminClient();

  // Call the database function that handles threshold logic
  const { data, error } = await supabase.rpc("chef_withdraw_ingredient", {
    p_ingredient_id: input.ingredient_id,
    p_quantity: input.quantity,
    p_note: input.note ?? null,
    p_chef_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  const result = data as unknown as WithdrawResult;

  if (!result.success) {
    return { error: result.error ?? "Erreur lors du retrait" };
  }

  revalidatePath("/admin/stock/ingredients");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin/stock/requests");

  if (result.needs_approval) {
    return {
      success: true,
      needs_approval: true,
      message: result.message ?? "Demande envoyée à l'admin pour approbation",
    };
  }

  return {
    success: true,
    needs_approval: false,
    newQuantity: result.new_quantity,
    message: result.message,
  };
}

// ============================================
// Get Low Stock Alerts
// ============================================

export async function getLowStockAlerts() {
  const supabase = createAdminClient();

  const [stockItemsRes, ingredientsRes] = await Promise.all([
    supabase
      .from("stock_items")
      .select("id, name, current_quantity, min_threshold, unit, menu_item_id")
      .eq("is_active", true),
    supabase
      .from("ingredients")
      .select("id, name, current_quantity, min_threshold, unit, ingredient_type")
      .eq("is_active", true),
  ]);

  // Filter items that need restocking
  const lowStockItems = (stockItemsRes.data ?? []).filter(
    (item) => item.current_quantity <= item.min_threshold
  ).map(item => ({
    ...item,
    item_type: "stock_item" as const,
    needs_restock: true,
  }));

  const lowIngredients = (ingredientsRes.data ?? []).filter(
    (item) => item.current_quantity <= item.min_threshold
  ).map(item => ({
    ...item,
    item_type: "ingredient" as const,
    needs_restock: true,
  }));

  return {
    data: [...lowStockItems, ...lowIngredients],
    stockItemsCount: lowStockItems.length,
    ingredientsCount: lowIngredients.length,
    totalCount: lowStockItems.length + lowIngredients.length,
  };
}

// ============================================
// Get ingredients for chef (with type info)
// ============================================

export async function getIngredientsForChef() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ingredients")
    .select("id, name, description, current_quantity, unit, min_threshold, approval_threshold, ingredient_type")
    .eq("is_active", true)
    .order("name");

  if (error) return { error: error.message };

  // Group by type for easier UI rendering
  const weighable = (data ?? []).filter(i => i.ingredient_type === "weighable");
  const unit = (data ?? []).filter(i => i.ingredient_type === "unit");

  return {
    data: data ?? [],
    weighable,
    unit,
  };
}

// ============================================
// Get today's chef movements
// ============================================

export async function getTodayChefMovements() {
  const supabase = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: movements, error } = await supabase
    .from("stock_movements")
    .select(`
      *,
      ingredient:ingredients(id, name, unit)
    `)
    .eq("reference_type", "chef_withdrawal")
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  // Fetch user info separately
  if (movements && movements.length > 0) {
    const userIds = [...new Set(movements.filter(m => m.performed_by).map(m => m.performed_by))];

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds as string[]);

      const userMap = new Map(users?.map(u => [u.id, u]) ?? []);

      const enrichedData = movements.map(m => ({
        ...m,
        performed_by_user: m.performed_by ? userMap.get(m.performed_by) ?? null : null,
      }));

      return { data: enrichedData };
    }
  }

  return { data: movements?.map(m => ({ ...m, performed_by_user: null })) ?? [] };
}

// ============================================
// Get pending withdrawal requests (for admin)
// ============================================

export async function getPendingWithdrawalRequests() {
  const isAdmin = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!isAdmin) return { error: "Non autorise" };

  const supabase = createAdminClient();

  const { data: requests, error } = await supabase
    .from("ingredient_requests")
    .select(`
      *,
      ingredient:ingredients(id, name, unit, current_quantity, approval_threshold)
    `)
    .eq("status", "pending")
    .eq("request_type", "withdrawal_approval")
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  // Fetch requester info
  if (requests && requests.length > 0) {
    const userIds = [...new Set(requests.filter(r => r.requested_by).map(r => r.requested_by))];

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds as string[]);

      const userMap = new Map(users?.map(u => [u.id, u]) ?? []);

      const enrichedData = requests.map(r => ({
        ...r,
        requester: r.requested_by ? userMap.get(r.requested_by) ?? null : null,
      }));

      return { data: enrichedData };
    }
  }

  return { data: requests?.map(r => ({ ...r, requester: null })) ?? [] };
}

// ============================================
// Approve withdrawal request
// ============================================

export async function approveWithdrawalRequest(requestId: string) {
  const isAdmin = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!isAdmin) return { error: "Non autorise - Seuls les administrateurs peuvent approuver les demandes" };

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Non authentifie" };

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("approve_withdrawal_request", {
    p_request_id: requestId,
    p_admin_id: user.id,
  });

  if (error) return { error: error.message };

  const result = data as { success: boolean; error?: string; new_quantity?: number };

  if (!result.success) {
    return { error: result.error ?? "Erreur lors de l'approbation" };
  }

  revalidatePath("/admin/stock/requests");
  revalidatePath("/admin/stock/ingredients");
  revalidatePath("/admin/kitchen");

  return { success: true, newQuantity: result.new_quantity };
}

// ============================================
// Reject withdrawal request
// ============================================

export async function rejectWithdrawalRequest(requestId: string, reason?: string) {
  const isAdmin = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!isAdmin) return { error: "Non autorise - Seuls les administrateurs peuvent rejeter les demandes" };

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Non authentifie" };

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("reject_withdrawal_request", {
    p_request_id: requestId,
    p_admin_id: user.id,
    p_reason: reason ?? null,
  });

  if (error) return { error: error.message };

  const result = data as { success: boolean; error?: string };

  if (!result.success) {
    return { error: result.error ?? "Erreur lors du rejet" };
  }

  revalidatePath("/admin/stock/requests");
  revalidatePath("/admin/kitchen");

  return { success: true };
}

// ============================================
// Update ingredient approval threshold
// ============================================

export async function updateIngredientThreshold(input: {
  ingredient_id: string;
  approval_threshold: number | null;
}) {
  const isAdmin = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!isAdmin) return { error: "Non autorise - Seuls les administrateurs peuvent modifier le seuil d'approbation" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ingredients")
    .update({
      approval_threshold: input.approval_threshold,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", input.ingredient_id);

  if (error) return { error: error.message };

  revalidatePath("/admin/stock/ingredients");
  return { success: true };
}

// ============================================
// Bulk update ingredient thresholds
// ============================================

export async function bulkUpdateIngredientThresholds(
  thresholds: { ingredient_id: string; approval_threshold: number | null }[]
) {
  const isAdmin = await hasRole(["super_admin", "admin"] as UserRole[]);
  if (!isAdmin) return { error: "Non autorise" };

  const supabase = createAdminClient();

  const errors: string[] = [];

  for (const item of thresholds) {
    const { error } = await supabase
      .from("ingredients")
      .update({
        approval_threshold: item.approval_threshold,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", item.ingredient_id);

    if (error) {
      errors.push(`${item.ingredient_id}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return { error: errors.join(", "), partialSuccess: errors.length < thresholds.length };
  }

  revalidatePath("/admin/stock/ingredients");
  return { success: true };
}
