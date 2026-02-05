"use client";

import { ShoppingCart, X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useHydratedCart } from "@/hooks/use-hydrated-cart";
import { CartSheetContent } from "./cart-sheet-content";

export function CartFab() {
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const { totalItems } = useHydratedCart();

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center cursor-pointer shadow-xl z-[1000] transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
        aria-label="Ouvrir le panier"
      >
        <ShoppingCart className="w-5 h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground min-w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center px-1">
            {totalItems}
          </span>
        )}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-up border border-border">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-foreground">
                Votre Commande
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center text-foreground transition-all duration-200 hover:bg-muted/80"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <CartSheetContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
