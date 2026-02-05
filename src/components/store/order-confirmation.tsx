"use client";

import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderConfirmationProps {
  orderNumber: string;
  onNewOrder: () => void;
}

export function OrderConfirmation({ orderNumber, onNewOrder }: OrderConfirmationProps) {
  return (
    <div className="text-center py-8 space-y-6">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-2xl font-bold text-foreground">
          Commande envoyee !
        </h3>
        <p className="text-muted-foreground">
          Votre commande a ete enregistree avec succes.
        </p>
      </div>

      <div className="bg-secondary/50 border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-1">Numero de commande</p>
        <p className="font-mono text-xl font-bold text-primary">{orderNumber}</p>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Nous preparons votre commande.</p>
        <p>Vous serez notifie lorsqu&apos;elle sera prete.</p>
      </div>

      <Button
        onClick={onNewOrder}
        variant="outline"
        className="w-full"
      >
        <ShoppingBag className="w-4 h-4 mr-2" />
        Nouvelle commande
      </Button>
    </div>
  );
}
