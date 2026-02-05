"use server";

import { createAdminClient, isCurrentUserAdmin } from "@/lib/supabase/admin";
import { createMenuItemSchema, updateMenuItemSchema } from "@/lib/validations/menu.schema";
import { revalidatePath } from "next/cache";
import type { MenuCategoryWithItems } from "@/types";

export async function getMenuWithCategories() {
  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from("menu_categories")
    .select(`
      *,
      items:menu_items(*)
    `)
    .eq("is_active", true)
    .order("sort_order")
    .order("sort_order", { referencedTable: "menu_items" });

  if (error) return { error: error.message };
  return { data: categories as unknown as MenuCategoryWithItems[] };
}

export async function getAllMenuCategories() {
  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from("menu_categories")
    .select("id, name, slug, tab")
    .order("sort_order");

  if (error) return { error: error.message };
  return { data: categories };
}

export async function getMenuItemById(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data: data as {
    id: string;
    name: string;
    description: string | null;
    price: number;
    price_small: number | null;
    category_id: string;
    is_available: boolean;
    is_featured: boolean;
    requires_order: boolean;
    sort_order: number;
  } };
}

export async function createMenuItem(input: unknown) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const parsed = createMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();
  const slug =
    parsed.data.slug ||
    parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const { error } = await supabase.from("menu_items").insert({
    ...parsed.data,
    slug,
  } as never);

  if (error) return { error: error.message };

  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true };
}

export async function updateMenuItem(input: unknown) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const parsed = updateMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const { id, ...data } = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("menu_items")
    .update(data as never)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true };
}

export async function deleteMenuItem(id: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true };
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable } as never)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true };
}
