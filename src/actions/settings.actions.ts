"use server";

import { createAdminClient, isCurrentUserAdmin, getCurrentUser } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { RestaurantSetting } from "@/types";

export async function getSettings() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("*");

  if (error) return { error: error.message };

  const rows = (data ?? []) as RestaurantSetting[];
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return { data: settings };
}

export async function updateSetting(key: string, value: unknown) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const user = await getCurrentUser();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("restaurant_settings")
    .upsert({
      key,
      value: value as Record<string, unknown>,
      updated_by: user?.id ?? null,
    } as never);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
