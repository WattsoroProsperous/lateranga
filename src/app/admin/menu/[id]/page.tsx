"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { MenuItem, MenuCategory } from "@/types";

type MenuCategoryRow = MenuCategory;
type MenuItemRow = MenuItem;

export default function MenuItemEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    price_small: "",
    category_id: "",
    is_available: true,
    is_featured: false,
    requires_order: false,
    sort_order: "0",
  });

  useEffect(() => {
    const supabase = createClient();

    // Fetch categories
    supabase
      .from("menu_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data as MenuCategoryRow[]);
      });

    // Fetch item if editing
    if (!isNew) {
      supabase
        .from("menu_items")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          const item = data as MenuItemRow | null;
          if (item) {
            setForm({
              name: item.name,
              description: item.description ?? "",
              price: String(item.price),
              price_small: item.price_small ? String(item.price_small) : "",
              category_id: item.category_id,
              is_available: item.is_available,
              is_featured: item.is_featured,
              requires_order: item.requires_order,
              sort_order: String(item.sort_order),
            });
          }
          setLoading(false);
        });
    }
  }, [id, isNew]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseInt(form.price, 10),
      price_small: form.price_small ? parseInt(form.price_small, 10) : null,
      category_id: form.category_id,
      is_available: form.is_available,
      is_featured: form.is_featured,
      requires_order: form.requires_order,
      sort_order: parseInt(form.sort_order, 10),
      slug: form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    };

    if (isNew) {
      const { error } = await supabase.from("menu_items").insert(payload as never);
      if (error) {
        toast.error("Erreur lors de la création");
      } else {
        toast.success("Article créé");
        router.push("/admin/menu");
      }
    } else {
      const { error } = await supabase
        .from("menu_items")
        .update(payload as never)
        .eq("id", id);
      if (error) {
        toast.error("Erreur lors de la mise à jour");
      } else {
        toast.success("Article mis à jour");
        router.push("/admin/menu");
      }
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/menu">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h2 className="font-display text-xl font-bold">
          {isNew ? "Nouvel article" : "Modifier l'article"}
        </h2>
      </div>

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (FCFA)</Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_small">Prix petit format (FCFA)</Label>
              <Input
                id="price_small"
                type="number"
                value={form.price_small}
                onChange={(e) =>
                  setForm({ ...form, price_small: e.target.value })
                }
                placeholder="Optionnel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Ordre d'affichage</Label>
            <Input
              id="sort_order"
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: e.target.value })
              }
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) =>
                  setForm({ ...form, is_available: e.target.checked })
                }
                className="size-4 rounded border"
              />
              Disponible
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm({ ...form, is_featured: e.target.checked })
                }
                className="size-4 rounded border"
              />
              Mis en avant
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requires_order}
                onChange={(e) =>
                  setForm({ ...form, requires_order: e.target.checked })
                }
                className="size-4 rounded border"
              />
              Sur commande
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enregistrement...
                </>
              ) : isNew ? (
                "Créer l'article"
              ) : (
                "Enregistrer"
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/menu">Annuler</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
