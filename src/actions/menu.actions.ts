"use server";

import { createClient } from "@/lib/supabase/server";
import { createMenuItemSchema, updateMenuItemSchema } from "@/lib/validations/menu.schema";
import { revalidatePath } from "next/cache";
import type { MenuCategoryWithItems } from "@/types";

export async function getMenuWithCategories() {
  const supabase = await createClient();

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

export async function createMenuItem(input: unknown) {
  const parsed = createMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
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
  const parsed = updateMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { id, ...data } = parsed.data;
  const supabase = await createClient();

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
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true };
}
