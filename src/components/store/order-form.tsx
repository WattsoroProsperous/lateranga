"use client";

import { useState, useTransition } from "react";
import { ShoppingBag, Loader2 } from "lucide-react";
import { useCartStore, selectTotalPrice } from "@/stores/cart-store";
import { createOrder } from "@/actions/order.actions";
import { toast } from "sonner";
import { OrderConfirmation } from "./order-confirmation";

export function OrderForm() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const setOpen = useCartStore((s) => s.setOpen);
  const total = useCartStore(selectTotalPrice);

  const [isPending, startTransition] = useTransition();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [orderType, setOrderType] = useState<"sur_place" | "emporter" | "livraison">("sur_place");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await createOrder({
        client_name: clientName,
        client_phone: clientPhone,
        order_type: orderType,
        delivery_address: orderType === "livraison" ? address : undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
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

      // Success
      setOrderNumber(result.orderNumber!);
      clearCart();
      toast.success("Commande envoyee avec succes !");
    });
  };

  const handleNewOrder = () => {
    setOrderNumber(null);
    setClientName("");
    setClientPhone("");
    setOrderType("sur_place");
    setAddress("");
    setNotes("");
    setOpen(false);
  };

  // Show confirmation if order was placed
  if (orderNumber) {
    return <OrderConfirmation orderNumber={orderNumber} onNewOrder={handleNewOrder} />;
  }

  const inputClass =
    "w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground text-[15px] transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block mb-2 font-semibold text-[13px] text-foreground">
          Votre nom *
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Ex: Mamadou Diallo"
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-[13px] text-foreground">
          Telephone *
        </label>
        <input
          type="tel"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="Ex: 07 00 00 00 00"
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-[13px] text-foreground">
          Type de commande
        </label>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value as typeof orderType)}
          disabled={isPending}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="sur_place">Sur place</option>
          <option value="emporter">A emporter</option>
          <option value="livraison">Livraison</option>
        </select>
      </div>

      {orderType === "livraison" && (
        <div>
          <label className="block mb-2 font-semibold text-[13px] text-foreground">
            Adresse de livraison
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Votre adresse complete..."
            disabled={isPending}
            className={`${inputClass} resize-vertical min-h-[80px]`}
          />
        </div>
      )}

      <div>
        <label className="block mb-2 font-semibold text-[13px] text-foreground">
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Instructions speciales, allergies..."
          disabled={isPending}
          className={`${inputClass} resize-vertical min-h-[80px]`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || items.length === 0}
        className="w-full px-4 py-4 bg-primary text-primary-foreground rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <ShoppingBag className="w-5 h-5" />
            Valider la commande
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
        Votre commande sera enregistree et preparee.
        <br />
        Total: {total.toLocaleString("fr-CI")} FCFA
      </p>
    </form>
  );
}
