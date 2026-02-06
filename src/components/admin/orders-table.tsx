"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatXOF, cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, RefreshCw, CreditCard, Check } from "lucide-react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/types";
import { markOrderAsPaid } from "@/actions/order.actions";

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En livraison",
  completed: "Complétée",
  cancelled: "Annulée",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  ready: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  delivering: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const allStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivering",
  "completed",
  "cancelled",
];

const paymentStatusLabels: Record<string, string> = {
  pending: "A payer",
  paid: "Payee",
  refunded: "Remboursee",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders: initialOrders }: OrdersTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId);
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus } as never)
      .eq("id", orderId);

    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Statut mis à jour: ${statusLabels[newStatus]}`);
    }
    setUpdating(null);
  }

  async function refreshOrders() {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  }

  function handleMarkAsPaid(orderId: string) {
    startTransition(async () => {
      const result = await markOrderAsPaid(orderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, payment_status: "paid" } : o
          )
        );
        toast.success("Commande marquee comme payee");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={refreshOrders}>
          <RefreshCw className="mr-2 size-4" />
          Actualiser
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucune commande trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const paymentStatus = order.payment_status ?? "pending";
                const isPaid = paymentStatus === "paid";

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.client_phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(v) =>
                          handleStatusChange(order.id, v as OrderStatus)
                        }
                        disabled={updating === order.id}
                      >
                        <SelectTrigger className="w-40 h-8">
                          <Badge
                            variant="secondary"
                            className={statusColors[order.status]}
                          >
                            {statusLabels[order.status]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusLabels[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {isPaid ? (
                        <Badge variant="secondary" className={paymentStatusColors[paymentStatus]}>
                          <Check className="size-3 mr-1" />
                          {paymentStatusLabels[paymentStatus]}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleMarkAsPaid(order.id)}
                          disabled={isPending || order.status === "cancelled"}
                        >
                          <CreditCard className="size-3 mr-1" />
                          Encaisser
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatXOF(order.total ?? 0)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("fr-CI", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
