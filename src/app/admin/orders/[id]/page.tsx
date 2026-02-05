import { createClient } from "@/lib/supabase/server";
import { formatXOF } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Order, OrderItem } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Détail commande | Admin La Teranga",
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  const order = orderData as Order | null;
  if (!order) notFound();

  const { data: itemsData } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  const items = (itemsData ?? []) as OrderItem[];

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    preparing: "En préparation",
    ready: "Prête",
    delivering: "En livraison",
    completed: "Complétée",
    cancelled: "Annulée",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h2 className="font-display text-xl font-bold">
            Commande {order.order_number}
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("fr-CI", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-sm">
          {statusLabels[order.status] ?? order.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display font-bold mb-4">Informations client</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-medium">{order.client_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd className="font-medium">{order.client_phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{order.order_type}</dd>
            </div>
            {order.delivery_address && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Adresse</dt>
                <dd className="font-medium">{order.delivery_address}</dd>
              </div>
            )}
            {order.notes && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="font-medium">{order.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-bold mb-4">Articles</h3>
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.item_name}</span>
                    {item.size_variant && (
                      <span className="ml-1 text-muted-foreground">
                        ({item.size_variant})
                      </span>
                    )}
                    <span className="ml-2 text-muted-foreground">
                      x{item.quantity}
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatXOF(item.line_total)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatXOF(order.total ?? 0)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun article trouvé
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
