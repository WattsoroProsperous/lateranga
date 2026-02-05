import { createClient } from "@/lib/supabase/server";
import { GalleryManager } from "@/components/admin/gallery-manager";
import type { GalleryImage } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galerie | Admin La Teranga",
};

export default async function AdminGalleryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: true });

  return <GalleryManager images={(data ?? []) as GalleryImage[]} />;
}
