"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, isCurrentUserStaff, hasRole } from "@/lib/supabase/admin";
import type { RestaurantTable, TableSession, TableLocation } from "@/types/database.types";

// ============================================
// Table Management
// ============================================

export async function getTables(): Promise<RestaurantTable[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .order("table_number", { ascending: true });

  if (error) {
    console.error("Error fetching tables:", error);
    return [];
  }

  return data ?? [];
}

export async function getTableById(id: string): Promise<RestaurantTable | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching table:", error);
    return null;
  }

  return data;
}

export async function getTableByToken(token: string): Promise<RestaurantTable | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("qr_code_token", token)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching table by token:", error);
    return null;
  }

  return data;
}

export async function createTable(input: {
  table_number: number;
  name: string;
  capacity?: number;
  location?: TableLocation;
}): Promise<{ table?: RestaurantTable; error?: string }> {
  const isStaff = await isCurrentUserStaff();
  if (!isStaff) {
    return { error: "Permission refusee" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({
      table_number: input.table_number,
      name: input.name,
      capacity: input.capacity ?? 4,
      location: input.location ?? "interieur",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating table:", error);
    if (error.code === "23505") {
      return { error: "Ce numero de table existe deja" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/tables");
  return { table: data };
}

export async function updateTable(
  id: string,
  input: {
    table_number?: number;
    name?: string;
    capacity?: number;
    location?: TableLocation;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const isStaff = await isCurrentUserStaff();
  if (!isStaff) {
    return { success: false, error: "Permission refusee" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("restaurant_tables")
    .update(input)
    .eq("id", id);

  if (error) {
    console.error("Error updating table:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/tables");
  return { success: true };
}

export async function deleteTable(id: string): Promise<{ success: boolean; error?: string }> {
  const canManage = await hasRole(["super_admin", "admin"]);
  if (!canManage) {
    return { success: false, error: "Permission refusee" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("restaurant_tables")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting table:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/tables");
  return { success: true };
}

export async function regenerateQRToken(id: string): Promise<{ token?: string; error?: string }> {
  const isStaff = await isCurrentUserStaff();
  if (!isStaff) {
    return { error: "Permission refusee" };
  }

  const supabase = createAdminClient();
  const newToken = crypto.randomUUID();

  const { error } = await supabase
    .from("restaurant_tables")
    .update({ qr_code_token: newToken })
    .eq("id", id);

  if (error) {
    console.error("Error regenerating QR token:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/tables");
  return { token: newToken };
}

// ============================================
// Table Sessions
// ============================================

export async function getActiveSession(tableId: string): Promise<TableSession | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("table_id", tableId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Get the most recent session for a table (active or ended within last 24 hours)
// Used for the orders page to show receipts after session ends
export async function getLastSession(tableId: string): Promise<TableSession | null> {
  const supabase = createAdminClient();
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data, error } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("table_id", tableId)
    .gte("created_at", twentyFourHoursAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getSessionByToken(sessionToken: string): Promise<{
  session: TableSession | null;
  table: RestaurantTable | null;
}> {
  const supabase = createAdminClient();
  const { data: session, error } = await supabase
    .from("table_sessions")
    .select("*, restaurant_tables(*)")
    .eq("session_token", sessionToken)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session) {
    return { session: null, table: null };
  }

  const table = session.restaurant_tables as unknown as RestaurantTable;
  return {
    session: { ...session, restaurant_tables: undefined } as TableSession,
    table
  };
}

export async function createTableSession(tableToken: string): Promise<{
  session?: TableSession;
  table?: RestaurantTable;
  error?: string;
  sessionInProgress?: boolean;
}> {
  const supabase = createAdminClient();

  // Get table by token
  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("qr_code_token", tableToken)
    .eq("is_active", true)
    .single();

  if (tableError || !table) {
    return { error: "Table non trouvee ou inactive" };
  }

  // Check if there's an active session for this table
  const { data: existingSession } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("table_id", table.id)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingSession) {
    // Session already in progress - don't create a new one
    return {
      table,
      session: existingSession,
      sessionInProgress: true
    };
  }

  // Create new session (3 hours)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 3);

  const { data: session, error: sessionError } = await supabase
    .from("table_sessions")
    .insert({
      table_id: table.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (sessionError || !session) {
    return { error: "Erreur lors de la creation de la session" };
  }

  return { session, table };
}

export async function endTableSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const isStaff = await isCurrentUserStaff();
  if (!isStaff) {
    return { success: false, error: "Permission refusee" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("table_sessions")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/tables");
  return { success: true };
}

// Validate a session token for a specific table
export async function validateSessionToken(
  tableId: string,
  sessionToken: string
): Promise<{
  valid: boolean;
  session?: TableSession;
  reason?: "invalid" | "expired" | "ended" | "wrong_table";
}> {
  const supabase = createAdminClient();

  // Get session by token
  const { data: session, error } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return { valid: false, reason: "invalid" };
  }

  // Check if session belongs to this table
  if (session.table_id !== tableId) {
    return { valid: false, reason: "wrong_table" };
  }

  // Check if session is ended
  if (!session.is_active || session.ended_at) {
    return { valid: false, session, reason: "ended" };
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    return { valid: false, session, reason: "expired" };
  }

  return { valid: true, session };
}

// Check if a session is still active (for client-side polling)
export async function checkSessionStatus(sessionId: string): Promise<{
  isActive: boolean;
  endedAt: string | null;
}> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("table_sessions")
    .select("is_active, ended_at, expires_at")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    return { isActive: false, endedAt: null };
  }

  // Check if session is expired
  const isExpired = new Date(data.expires_at) < new Date();

  return {
    isActive: data.is_active && !isExpired,
    endedAt: data.ended_at,
  };
}

// ============================================
// Table Status Overview
// ============================================

export async function getTablesWithStatus(): Promise<Array<RestaurantTable & {
  active_session: TableSession | null;
  pending_orders: number;
}>> {
  const supabase = createAdminClient();

  // Get all active tables
  const { data: tables, error: tablesError } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("is_active", true)
    .order("table_number", { ascending: true });

  if (tablesError || !tables) {
    return [];
  }

  // Get active sessions
  const { data: sessions } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString());

  // Get pending orders count per table
  const { data: orderCounts } = await supabase
    .from("orders")
    .select("table_id")
    .in("status", ["pending", "confirmed", "preparing", "ready"])
    .not("table_id", "is", null);

  const sessionMap = new Map(sessions?.map(s => [s.table_id, s]) ?? []);
  const orderCountMap = new Map<string, number>();

  orderCounts?.forEach(o => {
    if (o.table_id) {
      orderCountMap.set(o.table_id, (orderCountMap.get(o.table_id) ?? 0) + 1);
    }
  });

  return tables.map(table => ({
    ...table,
    active_session: sessionMap.get(table.id) ?? null,
    pending_orders: orderCountMap.get(table.id) ?? 0,
  }));
}
