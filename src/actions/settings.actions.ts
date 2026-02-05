"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RestaurantSetting } from "@/types";

export async function getSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("*");

  if (error) return { error: error.message };

  // Convert array to key-value map
  const rows = (data ?? []) as RestaurantSetting[];
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return { data: settings };
}

export async function updateSetting(key: string, value: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("restaurant_settings")
    .upsert({
      key,
      value: value as Record<string, unknown>,
      updated_by: user?.id ?? null,
    } as never);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
