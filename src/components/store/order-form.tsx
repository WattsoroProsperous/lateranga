"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useCartStore, selectTotalPrice } from "@/stores/cart-store";
import { formatXOF } from "@/lib/utils";
import { toast } from "sonner";

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "2250143848821";

export function OrderForm() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const setOpen = useCartStore((s) => s.setOpen);
  const total = useCartStore(selectTotalPrice);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [orderType, setOrderType] = useState("sur_place");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const typeLabels: Record<string, string> = {
      sur_place: "Sur place",
      emporter: "À emporter",
      livraison: "Livraison",
    };

    const itemLines = items
      .map((item) => `• ${item.qty}x ${item.name} — ${formatXOF(item.price * item.qty)}`)
      .join("\n");

    let message = `🍽️ *Nouvelle commande — La Teranga*\n\n`;
    message += `👤 *Client :* ${clientName}\n`;
    message += `📞 *Tél :* ${clientPhone}\n`;
    message += `📍 *Type :* ${typeLabels[orderType] || orderType}\n`;
    if (orderType === "livraison" && address) {
      message += `🏠 *Adresse :* ${address}\n`;
    }
    message += `\n📋 *Commande :*\n${itemLines}\n`;
    message += `\n💰 *Total : ${formatXOF(total, { long: true })}*`;
    if (notes) {
      message += `\n\n📝 *Notes :* ${notes}`;
    }

    // Ouvre WhatsApp avec le message pré-rempli
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    toast.success("Commande prête ! Envoyez le message sur WhatsApp.");
    clearCart();
    setOpen(false);
    setClientName("");
    setClientPhone("");
    setOrderType("sur_place");
    setAddress("");
    setNotes("");
  };

  const inputClass =
    "w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground text-[15px] transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground";

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
          className={inputClass}
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-[13px] text-foreground">
          Téléphone *
        </label>
        <input
          type="tel"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="Ex: 07 00 00 00 00"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-[13px] text-foreground">
          Type de commande
        </label>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="sur_place">Sur place</option>
          <option value="emporter">À emporter</option>
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
            placeholder="Votre adresse complète..."
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
          placeholder="Instructions spéciales, allergies..."
          className={`${inputClass} resize-vertical min-h-[80px]`}
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-4 bg-[#25D366] text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 hover:bg-[#1da851] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
      >
        <MessageCircle className="w-5 h-5" />
        Commander via WhatsApp
      </button>

      <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
        WhatsApp s&apos;ouvre avec votre commande pré-remplie.
        <br />
        Il suffit d&apos;appuyer sur Envoyer.
      </p>
    </form>
  );
}
