"use client";

import { Minus, Plus } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatXOF } from "@/lib/utils";
import type { CartItem } from "@/types";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateQty = useCartStore((s) => s.updateQty);

  return (
    <li className="flex justify-between items-center py-4 border-b border-border last:border-b-0 gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground">{item.name}</div>
        <div className="text-xs text-muted-foreground">
          {formatXOF(item.price)} x {item.qty}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQty(item.id, -1)}
          className="w-[30px] h-[30px] bg-secondary rounded-md flex items-center justify-center text-foreground transition-google hover:bg-muted"
          aria-label="Réduire la quantité"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-7 text-center font-semibold text-foreground text-sm">
          {item.qty}
        </span>
        <button
          onClick={() => updateQty(item.id, 1)}
          className="w-[30px] h-[30px] bg-secondary rounded-md flex items-center justify-center text-foreground transition-google hover:bg-muted"
          aria-label="Augmenter la quantité"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}
