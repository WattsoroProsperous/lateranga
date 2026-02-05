"use server";

import { createAdminClient, isCurrentUserAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { GalleryImage } from "@/types";

export async function getGalleryImages() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return { error: error.message };
  return { data: data as GalleryImage[] };
}

export async function getActiveGalleryImages() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return { error: error.message };
  return { data: data as GalleryImage[] };
}

export async function createGalleryImage(input: {
  url: string;
  alt_text?: string;
  image_type?: string;
  is_large?: boolean;
  sort_order?: number;
}) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();

  const { data: lastImage } = await supabase
    .from("gallery_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (lastImage?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("gallery_images").insert({
    url: input.url,
    alt_text: input.alt_text ?? null,
    image_type: input.image_type ?? "gallery",
    is_large: input.is_large ?? false,
    sort_order: input.sort_order ?? nextOrder,
    is_active: true,
  } as never);

  if (error) return { error: error.message };

  revalidatePath("/admin/gallery");
  revalidatePath("/");
  return { success: true };
}

export async function updateGalleryImage(
  id: string,
  input: {
    url?: string;
    alt_text?: string;
    is_large?: boolean;
    sort_order?: number;
    is_active?: boolean;
  }
) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("gallery_images")
    .update(input as never)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/gallery");
  revalidatePath("/");
  return { success: true };
}

export async function deleteGalleryImage(id: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();

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

export async function toggleGalleryImageActive(id: string, isActive: boolean) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("gallery_images")
    .update({ is_active: isActive } as never)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/gallery");
  revalidatePath("/");
  return { success: true };
}
