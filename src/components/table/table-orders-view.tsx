"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Check, ChefHat, Package, XCircle, CreditCard, UtensilsCrossed, Download, Heart } from "lucide-react";
import { cn, formatXOF } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessionOrders } from "@/actions/order.actions";
import { useTableSessionStore } from "@/stores/table-session-store";
import { useTableRealtime } from "@/hooks/use-table-realtime";
import type { RestaurantTable, TableSession } from "@/types/database.types";

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  line_total: number;
  size_variant: string | null;
}

interface SessionOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  payment_status: string;
  order_items: OrderItem[];
}

interface TableOrdersViewProps {
  table: RestaurantTable;
  session: TableSession;
  orders: SessionOrder[];
  tableToken: string;
  sessionToken?: string;
  initialSessionEnded?: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: "En attente",
    icon: <Clock className="size-4" />,
    color: "text-amber-600 bg-amber-50",
  },
  confirmed: {
    label: "Confirmee",
    icon: <Check className="size-4" />,
    color: "text-blue-600 bg-blue-50",
  },
  preparing: {
    label: "En preparation",
    icon: <ChefHat className="size-4" />,
    color: "text-orange-600 bg-orange-50",
  },
  ready: {
    label: "Prete",
    icon: <Package className="size-4" />,
    color: "text-green-600 bg-green-50",
  },
  completed: {
    label: "Terminee",
    icon: <Check className="size-4" />,
    color: "text-green-700 bg-green-100",
  },
  cancelled: {
    label: "Annulee",
    icon: <XCircle className="size-4" />,
    color: "text-red-600 bg-red-50",
  },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "A payer", color: "text-amber-600 bg-amber-50" },
  paid: { label: "Payee", color: "text-green-600 bg-green-50" },
  refunded: { label: "Remboursee", color: "text-blue-600 bg-blue-50" },
};

export function TableOrdersView({ table, session, orders: initialOrders, tableToken, sessionToken, initialSessionEnded = false }: TableOrdersViewProps) {
  const router = useRouter();

  // Build menu URL based on whether we have a session token
  const menuUrl = sessionToken
    ? `/table/${tableToken}/s/${sessionToken}/menu`
    : `/table/${tableToken}/menu`;
  const [orders, setOrders] = useState(initialOrders);
  const [sessionEnded, setSessionEnded] = useState(initialSessionEnded);
  const clearSession = useTableSessionStore((state) => state.clearSession);

  // Refresh orders from server
  const refreshOrders = useCallback(async () => {
    const result = await getSessionOrders(session.id);
    if (result.data) {
      setOrders(result.data as SessionOrder[]);
    }
  }, [session.id]);

  // Handle session end
  const handleSessionEnd = useCallback(() => {
    setSessionEnded(true);
    clearSession();
  }, [clearSession]);

  // Subscribe to realtime updates
  useTableRealtime({
    sessionId: session.id,
    onOrdersChange: refreshOrders,
    onSessionEnd: handleSessionEnd,
  });

  // Update orders when initialOrders prop changes (for SSR hydration)
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Clear local store if session is already ended
  useEffect(() => {
    if (initialSessionEnded) {
      clearSession();
    }
  }, [initialSessionEnded, clearSession]);

  // Calculate time remaining
  const expiresAt = new Date(session.expires_at);
  const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60));

  const totalToPay = orders
    .filter((o) => o.status !== "cancelled" && o.payment_status === "pending")
    .reduce((sum, o) => sum + o.total, 0);

  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const hasPaidOrders = paidOrders.length > 0;

  // Generate receipt image and trigger download
  const downloadReceipt = (order: SessionOrder) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 400;
    const padding = 30;
    const lineHeight = 24;
    const itemCount = order.order_items.length;
    const height = 380 + (itemCount * lineHeight);

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const centerText = (text: string, y: number, font: string, color: string) => {
      ctx.font = font;
      ctx.fillStyle = color;
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, (width - textWidth) / 2, y);
    };

    const dashedLine = (y: number) => {
      ctx.strokeStyle = '#000000';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    let y = 40;

    centerText('LA TERANGA', y, 'bold 24px Arial', '#000000');
    y += 28;
    centerText('Restaurant Senegalais', y, '14px Arial', '#666666');
    y += 22;
    centerText(table.name, y, '14px Arial', '#666666');
    y += 30;

    dashedLine(y);
    y += 25;

    ctx.font = '14px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText(`N° Commande: ${order.order_number}`, padding, y);
    y += 22;
    ctx.fillText(`Date: ${new Date(order.created_at).toLocaleString("fr-FR")}`, padding, y);
    y += 30;

    const badgeWidth = 80;
    const badgeHeight = 28;
    const badgeX = (width - badgeWidth) / 2;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(badgeX, y - 18, badgeWidth, badgeHeight, 14);
    ctx.fill();
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#ffffff';
    const paidText = 'PAYEE';
    const paidTextWidth = ctx.measureText(paidText).width;
    ctx.fillText(paidText, badgeX + (badgeWidth - paidTextWidth) / 2, y);
    y += 30;

    dashedLine(y);
    y += 25;

    ctx.font = '14px Arial';
    ctx.fillStyle = '#000000';
    order.order_items.forEach((item) => {
      const itemText = `${item.quantity}x ${item.item_name}`;
      const priceText = formatXOF(item.line_total);
      ctx.fillText(itemText, padding, y);
      const priceWidth = ctx.measureText(priceText).width;
      ctx.fillText(priceText, width - padding - priceWidth, y);
      y += lineHeight;
    });

    y += 10;
    dashedLine(y);
    y += 30;

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText('TOTAL', padding, y);
    const totalText = formatXOF(order.total);
    const totalWidth = ctx.measureText(totalText).width;
    ctx.fillText(totalText, width - padding - totalWidth, y);
    y += 35;

    dashedLine(y);
    y += 30;

    centerText('Merci de votre visite!', y, '14px Arial', '#666666');
    y += 22;
    centerText('A bientot chez La Teranga', y, '14px Arial', '#666666');

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-${order.order_number}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // Show session ended view
  if (sessionEnded) {
    const totalPaid = orders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + o.total, 0);

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="size-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <Heart className="size-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">Merci de votre visite!</h1>
            <p className="text-muted-foreground">
              Votre session a {table.name} est terminee.
            </p>
          </div>
          {totalPaid > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total paye</p>
              <p className="text-2xl font-bold text-green-700">{formatXOF(totalPaid)}</p>
            </div>
          )}
          <div className="space-y-3">
            {paidOrders.map((order) => (
              <Button
                key={order.id}
                variant="outline"
                size="sm"
                className="w-full border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => downloadReceipt(order)}
              >
                <Download className="size-4 mr-2" />
                Recu #{order.order_number}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            A bientot chez La Teranga!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between px-4 h-16">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary/10">
              <ArrowLeft className="size-5" />
            </Button>
            <div className="text-center flex items-center gap-2">
              <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="size-4 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-base">Mes Commandes</h1>
                <p className="text-xs text-muted-foreground">{table.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-full font-medium">
              <Clock className="size-3.5" />
              {timeRemaining}min
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Paid Orders Notification */}
        {hasPaidOrders && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="size-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Paiement recu!</p>
                <p className="text-sm text-green-600">
                  {paidOrders.length} commande{paidOrders.length > 1 ? "s" : ""} payee{paidOrders.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Card */}
        {orders.length > 0 && totalToPay > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total a payer</p>
                <p className="text-2xl font-bold text-primary">{formatXOF(totalToPay)}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Payez a la caisse</span>
              </div>
            </div>
          </Card>
        )}

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] ?? statusConfig.pending;
              const paymentStatus = paymentStatusConfig[order.payment_status] ?? paymentStatusConfig.pending;

              return (
                <Card key={order.id} className="overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Commande</p>
                        <p className="font-mono font-bold text-lg">{order.order_number}</p>
                      </div>
                      <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", status.color)}>
                        {status.icon}
                        {status.label}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full", paymentStatus.color)}>
                        {paymentStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="size-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <span>{item.item_name}</span>
                        </div>
                        <span className="font-medium">{formatXOF(item.line_total)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-bold text-primary">{formatXOF(order.total)}</span>
                  </div>

                  {/* Download Receipt Button for Paid Orders */}
                  {order.payment_status === "paid" && (
                    <div className="px-4 py-3 border-t bg-green-50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-green-200 text-green-700 hover:bg-green-100"
                        onClick={() => downloadReceipt(order)}
                      >
                        <Download className="size-4 mr-2" />
                        Telecharger le recu
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="size-10 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-lg mb-2">Aucune commande</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Vous n&apos;avez pas encore passe de commande
            </p>
            <Button onClick={() => router.push(menuUrl)}>
              <UtensilsCrossed className="size-4 mr-2" />
              Voir le menu
            </Button>
          </div>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full h-14 text-base rounded-xl shadow-lg"
            size="lg"
            onClick={() => router.push(menuUrl)}
          >
            <UtensilsCrossed className="size-5 mr-2" />
            Commander encore
          </Button>
        </div>
      </div>
    </div>
  );
}
