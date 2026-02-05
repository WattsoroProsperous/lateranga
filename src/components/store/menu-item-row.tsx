"use client";

import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { formatXOF, cn } from "@/lib/utils";
import { toast } from "sonner";

interface MenuItemRowProps {
  id: string;
  name: string;
  price: number;
  priceSmall?: number | null;
  description?: string | null;
}

export function MenuItemRow({
  id,
  name,
  price,
  priceSmall,
  description,
}: MenuItemRowProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    addItem({ id, name, price });
    toast.success(`${name} ajouté au panier`);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const priceDisplay = priceSmall
    ? `${formatXOF(priceSmall)} / ${formatXOF(price)}`
    : formatXOF(price);

  return (
    <div className="group/row flex justify-between items-center py-3.5 gap-3">
      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground text-[15px] block group-hover/row:text-primary transition-colors duration-200">
          {name}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground block mt-0.5 leading-relaxed">
            {description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-bold text-primary text-sm whitespace-nowrap tabular-nums">
          {priceDisplay}
        </span>
        <button
          onClick={handleAdd}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90",
            justAdded
              ? "bg-emerald-500 text-white scale-105"
              : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110"
          )}
          aria-label={`Ajouter ${name} au panier`}
        >
          {justAdded ? (
            <Check className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
