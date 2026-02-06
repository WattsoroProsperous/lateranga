"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, ChefHat, CheckCircle, XCircle, Bell, AlertTriangle, Package } from "lucide-react";
import { cn, formatXOF } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/order.actions";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderItem, OrderStatus } from "@/types/database.types";
import { useCurrentUser } from "@/hooks/use-current-user";

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  restaurant_tables?: { name: string } | null;
}

interface KitchenBoardProps {
  initialOrders: OrderWithItems[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "En attente", color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" },
  confirmed: { label: "Confirmee", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  preparing: { label: "En preparation", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200" },
  ready: { label: "Prete", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
};

const columns = [
  { status: "pending" as OrderStatus, title: "En attente", icon: Bell },
  { status: "confirmed" as OrderStatus, title: "Confirmees", icon: CheckCircle },
  { status: "preparing" as OrderStatus, title: "En preparation", icon: ChefHat },
  { status: "ready" as OrderStatus, title: "Pretes", icon: CheckCircle },
];

export function KitchenBoard({ initialOrders }: KitchenBoardProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [cancelDialog, setCancelDialog] = useState<OrderWithItems | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const { role } = useCurrentUser();

  const canCancel = role === "super_admin" || role === "admin" || role === "chef";

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          // Refresh on any order change
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Play sound for new orders
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === "pending").length;
    const initialPendingCount = initialOrders.filter(o => o.status === "pending").length;

    if (pendingCount > initialPendingCount) {
      // New order arrived
      playNotificationSound();
    }
  }, [orders, initialOrders]);

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 1000;
      osc2.type = "sine";
      osc2.start();
      setTimeout(() => osc2.stop(), 200);
    }, 250);
  };

  const handleStatusChange = (order: OrderWithItems, newStatus: OrderStatus) => {
    startTransition(async () => {
      const result = await updateOrderStatus({ id: order.id, status: newStatus });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Commande ${order.order_number} mise a jour`);
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (!cancelDialog || !cancelReason.trim()) {
      toast.error("Veuillez indiquer une raison d'annulation");
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatus({
        id: cancelDialog.id,
        status: "cancelled" as OrderStatus,
        cancellation_reason: cancelReason,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Commande ${cancelDialog.order_number} annulee`);
      setCancelDialog(null);
      setCancelReason("");
      router.refresh();
    });
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<string, OrderStatus> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
    };
    return flow[currentStatus] ?? null;
  };

  const getTimeElapsed = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h${minutes % 60}min`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Cuisine</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} commande{orders.length > 1 ? "s" : ""} en cours
            </p>
          </div>
          <div className="flex items-center gap-4">
            {orders.filter(o => o.status === "pending").length > 0 && (
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full">
                <AlertTriangle className="size-4" />
                <span className="font-medium">
                  {orders.filter(o => o.status === "pending").length} en attente
                </span>
              </div>
            )}
            <Link href="/admin/kitchen/ingredients">
              <Button variant="outline" className="gap-2">
                <Package className="size-4" />
                Retrait Ingredients
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 min-w-max h-full">
          {columns.map((column) => {
            const columnOrders = orders.filter((o) => o.status === column.status);
            const Icon = column.icon;

            return (
              <div
                key={column.status}
                className="w-80 flex flex-col bg-muted/30 rounded-xl"
              >
                {/* Column Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("size-5", statusConfig[column.status].color)} />
                    <h2 className="font-semibold">{column.title}</h2>
                    <span className="ml-auto bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-sm font-medium">
                      {columnOrders.length}
                    </span>
                  </div>
                </div>

                {/* Orders */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {columnOrders.map((order) => {
                    const nextStatus = getNextStatus(order.status);
                    const timeElapsed = getTimeElapsed(order.created_at);
                    const isUrgent = order.status === "pending" && parseInt(timeElapsed) > 10;

                    return (
                      <Card
                        key={order.id}
                        className={cn(
                          "p-3 border-2 transition-all",
                          statusConfig[order.status].bgColor,
                          isUrgent && "animate-pulse border-red-400"
                        )}
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-mono font-bold text-lg">
                              {order.order_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.restaurant_tables?.name ?? order.client_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="size-3" />
                            {timeElapsed}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-1 mb-3">
                          {order.order_items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="font-medium">
                                {item.quantity}x {item.item_name}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded mb-3">
                            <strong>Note:</strong> {order.notes}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {nextStatus && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleStatusChange(order, nextStatus)}
                              disabled={isPending}
                            >
                              {nextStatus === "confirmed" && "Confirmer"}
                              {nextStatus === "preparing" && "Commencer"}
                              {nextStatus === "ready" && "Terminer"}
                            </Button>
                          )}
                          {canCancel && order.status !== "ready" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setCancelDialog(order)}
                              disabled={isPending}
                            >
                              <XCircle className="size-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}

                  {columnOrders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Aucune commande
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la commande {cancelDialog?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Raison de l&apos;annulation *
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Article epuise, erreur de commande..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>
              Retour
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!cancelReason.trim() || isPending}
            >
              Confirmer l&apos;annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
