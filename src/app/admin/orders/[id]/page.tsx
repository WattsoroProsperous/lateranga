import { createAdminClient } from "@/lib/supabase/admin";
import { formatXOF } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusTimeline } from "@/components/admin/order-status-timeline";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Order, OrderItem } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Detail commande | Admin La Teranga",
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

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
    confirmed: "Confirmee",
    preparing: "En preparation",
    ready: "Prete",
    delivering: "En livraison",
    completed: "Terminee",
    cancelled: "Annulee",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
    preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
    ready: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    delivering: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  };

  const typeLabels: Record<string, string> = {
    sur_place: "Sur place",
    emporter: "A emporter",
    livraison: "Livraison",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
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
        <Badge className={statusColors[order.status] ?? ""}>
          {statusLabels[order.status] ?? order.status}
        </Badge>
      </div>

      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">Progression</h3>
        <OrderStatusTimeline
          currentStatus={order.status}
          orderType={order.order_type}
        />
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">Actions</h3>
        <OrderStatusActions
          orderId={order.id}
          currentStatus={order.status}
          orderType={order.order_type}
        />
        {order.status === "completed" && (
          <p className="text-green-600 dark:text-green-400 font-medium mt-4">
            Cette commande est terminee.
          </p>
        )}
        {order.status === "cancelled" && order.cancellation_reason && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mt-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Raison:</strong> {order.cancellation_reason}
            </p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display font-bold mb-4">Informations client</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-medium">{order.client_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Telephone</dt>
              <dd className="font-medium">{order.client_phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">
                {typeLabels[order.order_type] ?? order.order_type}
              </dd>
            </div>
            {order.delivery_address && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Adresse</dt>
                <dd className="font-medium text-right max-w-[200px]">
                  {order.delivery_address}
                </dd>
              </div>
            )}
            {order.notes && (
              <div className="pt-2 border-t">
                <dt className="text-muted-foreground mb-1">Notes</dt>
                <dd className="font-medium bg-muted/50 p-2 rounded">
                  {order.notes}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-bold mb-4">Articles commandes</h3>
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
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Frais de livraison</span>
                  <span>{formatXOF(order.delivery_fee)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatXOF(order.total ?? 0)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun article trouve
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
