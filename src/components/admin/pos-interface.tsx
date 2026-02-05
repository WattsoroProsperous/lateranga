"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, Minus, Trash2, Loader2, CheckCircle, Printer, Download, X } from "lucide-react";
import { cn, formatXOF } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPOSOrder } from "@/actions/order.actions";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  price_small: number | null;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  tab: string;
  items: MenuItem[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface LastSale {
  orderNumber: string;
  clientName: string;
  items: CartItem[];
  total: number;
  date: Date;
}

interface POSInterfaceProps {
  categories: Category[];
}

export function POSInterface({ categories }: POSInterfaceProps) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.tab ?? "plats");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [lastSale, setLastSale] = useState<LastSale | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const filteredCategories = categories.filter((c) => c.tab === activeTab);
  const tabs = [...new Set(categories.map((c) => c.tab))];

  const tabLabels: Record<string, string> = {
    plats: "Plats",
    desserts: "Desserts",
    boissons: "Boissons",
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
    setLastSale(null);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setClientName("");
  };

  const clearReceipt = () => {
    setLastSale(null);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    const saleItems = [...cart];
    const saleTotal = total;
    const saleClientName = clientName || "Client sur place";

    startTransition(async () => {
      const result = await createPOSOrder({
        client_name: saleClientName,
        client_phone: "0000000000",
        order_type: "sur_place",
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setLastSale({
        orderNumber: result.orderNumber!,
        clientName: saleClientName,
        items: saleItems,
        total: saleTotal,
        date: new Date(),
      });
      setCart([]);
      setClientName("");
      toast.success(`Vente ${result.orderNumber} enregistree !`);
    });
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenetre d'impression");
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recu ${lastSale?.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 300px;
            margin: 0 auto;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 18px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          .divider { border-top: 1px dashed #000; margin: 15px 0; }
          .info { font-size: 12px; margin-bottom: 15px; }
          .info p { margin-bottom: 3px; }
          .items { font-size: 12px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 70px; text-align: right; }
          .total { font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LA TERANGA</h1>
          <p>Restaurant Senegalais</p>
          <p>Abidjan, Cote d'Ivoire</p>
        </div>
        <div class="divider"></div>
        <div class="info">
          <p><strong>Recu:</strong> ${lastSale?.orderNumber}</p>
          <p><strong>Date:</strong> ${lastSale?.date.toLocaleDateString("fr-CI")} ${lastSale?.date.toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" })}</p>
          <p><strong>Client:</strong> ${lastSale?.clientName}</p>
        </div>
        <div class="divider"></div>
        <div class="items">
          ${lastSale?.items.map(item => `
            <div class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">x${item.qty}</span>
              <span class="item-price">${(item.price * item.qty).toLocaleString("fr-CI")} F</span>
            </div>
          `).join("")}
        </div>
        <div class="divider"></div>
        <div class="total">
          <span>TOTAL</span>
          <span>${lastSale?.total.toLocaleString("fr-CI")} FCFA</span>
        </div>
        <div class="divider"></div>
        <div class="footer">
          <p>Merci de votre visite !</p>
          <p>A bientot</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Close the window after printing (or when print dialog is cancelled)
    printWindow.onafterprint = () => {
      printWindow.close();
    };

    // Fallback for browsers that don't support onafterprint
    printWindow.print();

    // Some browsers close immediately, others need a small delay
    // This handles the case where onafterprint doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 1000);
  };

  const handleDownload = () => {
    if (!lastSale) return;

    const receiptText = `
========================================
           LA TERANGA
       Restaurant Senegalais
      Abidjan, Cote d'Ivoire
========================================

Recu: ${lastSale.orderNumber}
Date: ${lastSale.date.toLocaleDateString("fr-CI")} ${lastSale.date.toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" })}
Client: ${lastSale.clientName}

----------------------------------------
${lastSale.items.map(item => `${item.name.padEnd(20)} x${item.qty}  ${(item.price * item.qty).toLocaleString("fr-CI").padStart(8)} F`).join("\n")}
----------------------------------------

TOTAL:              ${lastSale.total.toLocaleString("fr-CI").padStart(12)} FCFA

========================================
       Merci de votre visite !
            A bientot
========================================
`;

    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recu-${lastSale.orderNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Recu telecharge");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg font-semibold text-sm transition-colors",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {tabLabels[tab] ?? tab}
            </button>
          ))}
        </div>

        {/* Categories and Items */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <h3 className="font-display font-bold text-lg mb-3">{category.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {category.items
                  .filter((item) => item.is_available)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      disabled={isPending}
                      className="p-4 bg-card border border-border rounded-xl text-left hover:border-primary hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <p className="font-semibold text-sm line-clamp-2 mb-2">
                        {item.name}
                      </p>
                      <p className="text-primary font-bold">
                        {formatXOF(item.price)}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart & Receipt */}
      <div className="w-96 flex flex-col gap-4">
        {/* Cart */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl p-4 min-h-0">
          <h2 className="font-display font-bold text-lg mb-4">Panier</h2>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Panier vide
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatXOF(item.price)} x {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Plus className="size-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-destructive/10 text-destructive rounded ml-1"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Client Name */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Nom client (optionnel)
            </label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client sur place"
              disabled={isPending}
            />
          </div>

          {/* Total */}
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-display font-bold text-xl text-primary">
                {formatXOF(total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Valider la vente"
              )}
            </Button>
            <Button
              onClick={clearCart}
              variant="outline"
              disabled={cart.length === 0 || isPending}
              className="w-full"
            >
              Vider le panier
            </Button>
          </div>
        </div>

        {/* Receipt */}
        {lastSale && (
          <div
            ref={receiptRef}
            className="bg-card border border-border rounded-xl p-4 animate-in slide-in-from-bottom-4 duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-5 text-green-600" />
                <h3 className="font-display font-bold text-green-600">Vente enregistree</h3>
              </div>
              <button
                onClick={clearReceipt}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mb-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">N° Recu</span>
                <span className="font-bold">{lastSale.orderNumber}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Date</span>
                <span>{lastSale.date.toLocaleDateString("fr-CI")} {lastSale.date.toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span>{lastSale.clientName}</span>
              </div>
            </div>

            <div className="space-y-1 mb-3 text-sm">
              {lastSale.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.name} <span className="text-muted-foreground">x{item.qty}</span>
                  </span>
                  <span className="font-medium">{formatXOF(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-display font-bold text-lg text-primary">
                  {formatXOF(lastSale.total)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Printer className="size-4 mr-2" />
                Imprimer
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Download className="size-4 mr-2" />
                Telecharger
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
