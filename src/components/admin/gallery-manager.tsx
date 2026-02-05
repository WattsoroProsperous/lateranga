"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import type { GalleryImage } from "@/types";

interface GalleryManagerProps {
  images: GalleryImage[];
}

export function GalleryManager({ images: initialImages }: GalleryManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const supabase = createClient();

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(path, file);

        if (uploadError) {
          toast.error(`Erreur upload: ${file.name}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(path);

        const { data: newImage, error: insertError } = await supabase
          .from("gallery_images")
          .insert({
            storage_path: path,
            url: publicUrl,
            alt_text: file.name.replace(/\.\w+$/, ""),
            sort_order: images.length,
            is_active: true,
          } as never)
          .select()
          .single();

        if (insertError) {
          toast.error("Erreur lors de l'enregistrement");
        } else if (newImage) {
          setImages((prev) => [...prev, newImage as GalleryImage]);
          toast.success("Image ajoutée");
        }
      }

      setUploading(false);
      // Reset input
      e.target.value = "";
    },
    [images.length]
  );

  async function handleDelete(image: GalleryImage) {
    if (!confirm("Supprimer cette image ?")) return;

    setDeleting(image.id);
    const supabase = createClient();

    // Delete from storage
    if (image.storage_path) {
      await supabase.storage.from("images").remove([image.storage_path]);
    }

    // Delete from DB
    const { error } = await supabase
      .from("gallery_images")
      .delete()
      .eq("id", image.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      setImages((prev) => prev.filter((i) => i.id !== image.id));
      toast.success("Image supprimée");
    }

    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {images.length} image{images.length !== 1 ? "s" : ""}
        </p>
        <div>
          <input
            id="gallery-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="gallery-upload" className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Ajouter des images
                </>
              )}
            </label>
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Upload className="size-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Aucune image dans la galerie
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Cliquez sur &quot;Ajouter des images&quot; pour commencer
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative rounded-lg overflow-hidden border">
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt={image.alt_text ?? ""}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(image)}
                  disabled={deleting === image.id}
                >
                  {deleting === image.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
              {image.alt_text && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.alt_text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
