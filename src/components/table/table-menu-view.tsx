"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, ShoppingCart, Trash2, Send, Clock, Check, ArrowLeft, UtensilsCrossed, ClipboardList, Heart } from "lucide-react";
import { cn, formatXOF } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useTableSessionStore } from "@/stores/table-session-store";
import { useTableRealtime } from "@/hooks/use-table-realtime";
import { createTableOrder } from "@/actions/order.actions";
import type { RestaurantTable, TableSession, MenuTab } from "@/types/database.types";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  price_small: number | null;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  tab: MenuTab;
  items: MenuItem[];
}

interface TableMenuViewProps {
  table: RestaurantTable;
  session: TableSession;
  categories: Category[];
  tableToken: string;
  sessionToken?: string;
}

const tabLabels: Record<string, string> = {
  plats: "Plats",
  desserts: "Desserts",
  boissons: "Boissons",
};

const tabIcons: Record<string, string> = {
  plats: "🍲",
  desserts: "🍰",
  boissons: "🥤",
};

export function TableMenuView({ table, session, categories, tableToken, sessionToken }: TableMenuViewProps) {
  // Build orders URL based on whether we have a session token
  const ordersUrl = sessionToken
    ? `/table/${tableToken}/s/${sessionToken}/orders`
    : `/table/${tableToken}/orders`;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.tab ?? "plats");
  const [isPending, startTransition] = useTransition();
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const { cart, addToCart, updateQty, removeFromCart, clearCart, getTotal } = useTableSessionStore();
  const clearSession = useTableSessionStore((state) => state.clearSession);

  // Handle session end
  const handleSessionEnd = useCallback(() => {
    setSessionEnded(true);
    clearSession();
  }, [clearSession]);

  // Subscribe to realtime session updates
  useTableRealtime({
    sessionId: session.id,
    onSessionEnd: handleSessionEnd,
  });

  const filteredCategories = categories.filter((c) => c.tab === activeTab);
  const tabs = [...new Set(categories.map((c) => c.tab))];
  const total = getTotal();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleAddItem = (item: MenuItem, sizeVariant?: "petit" | "grand") => {
    const price = sizeVariant === "petit" && item.price_small ? item.price_small : item.price;
    const name = sizeVariant ? `${item.name} (${sizeVariant})` : item.name;

    addToCart({
      id: `${item.id}-${sizeVariant ?? "normal"}`,
      name,
      price,
      sizeVariant,
    });

    toast.success(`${name} ajoute au panier`);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }

    startTransition(async () => {
      const result = await createTableOrder({
        table_id: table.id,
        table_session_id: session.id,
        client_name: `Table ${table.table_number}`,
        items: cart.map((item) => {
          // Extract original UUID by removing the size variant suffix (-normal, -petit, -grand)
          const lastDashIndex = item.id.lastIndexOf("-");
          const originalId = lastDashIndex > 0 ? item.id.substring(0, lastDashIndex) : item.id;
          return {
            id: originalId,
            name: item.name,
            price: item.price,
            qty: item.qty,
            sizeVariant: item.sizeVariant,
          };
        }),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setOrderSuccess(result.orderNumber!);
      clearCart();
      setShowCart(false);
    });
  };

  // Calculate time remaining
  const expiresAt = new Date(session.expires_at);
  const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60));

  // Session ended view
  if (sessionEnded) {
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
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Pour passer une nouvelle commande, scannez a nouveau le QR code de la table.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            A bientot chez La Teranga!
          </p>
        </Card>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-green-50 to-background flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md p-6 text-center space-y-5 mx-auto">
          <div className="flex justify-center">
            <div className="size-16 sm:size-20 bg-green-500/10 rounded-full flex items-center justify-center">
              <Check className="size-8 sm:size-10 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-green-600">Commande envoyee !</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Votre commande a ete transmise en cuisine
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Numero de commande</p>
            <p className="font-mono text-lg sm:text-2xl font-bold break-all">{orderSuccess}</p>
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <p>Conservez ce numero pour le paiement a la caisse.</p>
            <p>Nous vous servirons des que votre commande sera prete.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setOrderSuccess(null)}
            >
              Nouvelle commande
            </Button>
            <Button
              className="flex-1 h-12"
              onClick={() => router.push(ordersUrl)}
            >
              Voir mes commandes
            </Button>
          </div>
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
                <h1 className="font-display font-bold text-base">La Teranga</h1>
                <p className="text-xs text-muted-foreground">{table.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(ordersUrl)}
                className="hover:bg-primary/10 size-9"
                title="Mes commandes"
              >
                <ClipboardList className="size-5 text-primary" />
              </Button>
              <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-full font-medium">
                <Clock className="size-3.5" />
                {timeRemaining}min
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted"
                )}
              >
                <span>{tabIcons[tab]}</span>
                {tabLabels[tab] ?? tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {filteredCategories.map((category) => (
          <section key={category.id}>
            <h2 className="font-display font-bold text-xl mb-4 text-foreground">{category.name}</h2>
            <div className="space-y-4">
              {category.items.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex">
                    {item.image_url && (
                      <div
                        className="w-28 h-28 bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${item.image_url})` }}
                      />
                    )}
                    <div className={cn("flex-1 p-4 flex flex-col justify-between", !item.image_url && "w-full")}>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {item.price_small ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddItem(item, "petit")}
                              className="text-xs h-8"
                            >
                              <Plus className="size-3 mr-1" />
                              Petit {formatXOF(item.price_small)}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAddItem(item, "grand")}
                              className="text-xs h-8"
                            >
                              <Plus className="size-3 mr-1" />
                              Grand {formatXOF(item.price)}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-lg text-primary">
                              {formatXOF(item.price)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleAddItem(item)}
                              className="h-9"
                            >
                              <Plus className="size-4 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Aucun plat disponible dans cette categorie</p>
          </div>
        )}
      </main>

      {/* Cart Button - Fixed */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetTrigger asChild>
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent">
            <div className="max-w-lg mx-auto">
              <Button
                className={cn(
                  "w-full h-14 text-base rounded-xl shadow-lg transition-all",
                  cartCount > 0
                    ? "shadow-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-muted"
                )}
                size="lg"
                disabled={cartCount === 0}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <ShoppingCart className="size-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 size-5 bg-white text-primary text-xs font-bold rounded-full flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <span>Voir le panier</span>
                  </div>
                  <span className="font-bold">{formatXOF(total)}</span>
                </div>
              </Button>
            </div>
          </div>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl w-full max-w-lg !left-1/2 !-translate-x-1/2 !right-auto">
          <div className="flex flex-col h-full">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5" />
                Votre panier ({cartCount} article{cartCount > 1 ? "s" : ""})
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-primary font-semibold">
                      {formatXOF(item.price * item.qty)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-background rounded-full p-1 border">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="size-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="size-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="size-8 flex items-center justify-center hover:bg-destructive/10 text-destructive rounded-full transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center py-12">
                  <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="size-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Votre panier est vide</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajoutez des plats pour commencer
                  </p>
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <SheetFooter className="flex-col gap-4 border-t pt-4 pb-safe">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-xl text-primary">{formatXOF(total)}</span>
                </div>
                <Button
                  className="w-full h-14 rounded-xl text-base"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isPending}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </span>
                  ) : (
                    <>
                      <Send className="size-5 mr-2" />
                      Commander maintenant
                    </>
                  )}
                </Button>
              </SheetFooter>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
