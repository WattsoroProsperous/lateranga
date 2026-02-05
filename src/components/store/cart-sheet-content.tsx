"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore, selectTotalPrice } from "@/stores/cart-store";
import { formatXOF } from "@/lib/utils";
import { CartItemRow } from "./cart-item-row";
import { OrderForm } from "./order-form";

export function CartSheetContent() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectTotalPrice);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <ShoppingCart className="w-14 h-14 mx-auto mb-4 opacity-40" />
        <p className="font-medium">Votre panier est vide</p>
        <p className="text-sm mt-1">Ajoutez des plats depuis le menu</p>
      </div>
    );
  }

  return (
    <div>
      {/* Items */}
      <ul className="mb-6">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </ul>

      {/* Total */}
      <div className="flex justify-between items-center py-5 border-t-2 border-border text-lg font-semibold">
        <span>Total</span>
        <span className="text-primary font-bold">{formatXOF(total)}</span>
      </div>

      {/* Order Form */}
      <OrderForm />
    </div>
  );
}
