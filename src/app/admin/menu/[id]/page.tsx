"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  createMenuItem,
  updateMenuItem,
  getAllMenuCategories,
  getMenuItemById,
} from "@/actions/menu.actions";
import type { MenuCategory } from "@/types";

export default function MenuItemEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(!isNew);
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
    async function loadData() {
      const catResult = await getAllMenuCategories();
      if (catResult.data) {
        setCategories(catResult.data as MenuCategory[]);
      }

      if (!isNew) {
        const itemResult = await getMenuItemById(id);
        if (itemResult.data) {
          const item = itemResult.data;
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
      }
    }
    loadData();
  }, [id, isNew]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation côté client
    if (!form.category_id) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }

    console.log("[Menu Form] Submitting with category_id:", form.category_id);

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
    };

    startTransition(async () => {
      if (isNew) {
        const result = await createMenuItem(payload);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Article cree");
          router.push("/admin/menu");
        }
      } else {
        const result = await updateMenuItem({ id, ...payload });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Article mis a jour");
          router.push("/admin/menu");
        }
      }
    });
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
            <Label htmlFor="category">Categorie</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => {
                console.log("[Menu Form] Category selected:", v);
                setForm({ ...form, category_id: v });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une categorie" />
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
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enregistrement...
                </>
              ) : isNew ? (
                "Creer l'article"
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
