"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatXOF } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, ToggleLeft, ToggleRight, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { MenuItem } from "@/types";

interface MenuItemsTableProps {
  items: MenuItem[];
}

export function MenuItemsTable({ items: initialItems }: MenuItemsTableProps) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleAvailability(id: string, current: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !current } as never)
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, is_available: !current } : i
        )
      );
      toast.success(!current ? "Article activé" : "Article désactivé");
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Supprimer cet article ?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Article supprimé");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un article..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button asChild>
          <Link href="/admin/menu/new">Ajouter un article</Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  Aucun article trouvé
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatXOF(item.price)}
                    {item.price_small && (
                      <span className="ml-1 text-sm text-muted-foreground">
                        / {formatXOF(item.price_small)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        item.is_available
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }
                    >
                      {item.is_available ? "Disponible" : "Indisponible"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleAvailability(item.id, item.is_available)
                        }
                        title={
                          item.is_available ? "Désactiver" : "Activer"
                        }
                      >
                        {item.is_available ? (
                          <ToggleRight className="size-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/menu/${item.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
