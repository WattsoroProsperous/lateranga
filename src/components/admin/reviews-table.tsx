"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Check, X, Star, Shield } from "lucide-react";
import type { Review } from "@/types";

interface ReviewsTableProps {
  reviews: Review[];
}

export function ReviewsTable({ reviews: initialReviews }: ReviewsTableProps) {
  const [reviews, setReviews] = useState(initialReviews);

  async function handleModerate(id: string, approved: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: approved } as never)
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la modération");
    } else {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: approved } : r))
      );
      toast.success(approved ? "Avis approuvé" : "Avis rejeté");
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("reviews")
      .update({ is_featured: !current } as never)
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_featured: !current } : r
        )
      );
      toast.success(!current ? "Mis en avant" : "Retiré de la mise en avant");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet avis ?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Avis supprimé");
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Auteur</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Avis</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-40">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                Aucun avis
              </TableCell>
            </TableRow>
          ) : (
            reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{review.author_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.source}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{review.rating}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="line-clamp-2 max-w-xs text-sm">
                    {review.text}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant="secondary"
                      className={
                        review.is_approved
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }
                    >
                      {review.is_approved ? "Approuvé" : "En attente"}
                    </Badge>
                    {review.is_featured && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        En vedette
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {!review.is_approved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleModerate(review.id, true)}
                        title="Approuver"
                      >
                        <Check className="size-4 text-green-600" />
                      </Button>
                    )}
                    {review.is_approved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleModerate(review.id, false)}
                        title="Rejeter"
                      >
                        <X className="size-4 text-orange-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleFeatured(review.id, review.is_featured)
                      }
                      title={
                        review.is_featured
                          ? "Retirer de la mise en avant"
                          : "Mettre en avant"
                      }
                    >
                      <Shield
                        className={`size-4 ${
                          review.is_featured
                            ? "text-primary fill-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(review.id)}
                      title="Supprimer"
                    >
                      <X className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
