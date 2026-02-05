"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { GalleryImage } from "@/types";

export async function getGalleryImages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return { error: error.message };
  return { data: data as GalleryImage[] };
}

export async function deleteGalleryImage(id: string) {
  const supabase = await createClient();

  // Get image to find storage path
  const { data } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("id", id)
    .single();

  const image = data as GalleryImage | null;

  if (image?.storage_path) {
    await supabase.storage.from("images").remove([image.storage_path]);
  }

  const { error } = await supabase
    .from("gallery_images")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/gallery");
  revalidatePath("/");
  return { success: true };
}
