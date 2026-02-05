"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface NewOrder {
  id: string;
  order_number: string;
  client_name: string;
  total: number;
}

export function OrderNotifications() {
  const [newOrderCount, setNewOrderCount] = useState(0);
  const router = useRouter();

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);

      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = "sine";
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.2);
      }, 250);
    } catch {
      // Audio not supported
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as NewOrder;
          setNewOrderCount((c) => c + 1);

          // Play sound
          playNotificationSound();

          // Show toast
          toast.info(
            `Nouvelle commande: ${newOrder.order_number}`,
            {
              description: `${newOrder.client_name} - ${newOrder.total?.toLocaleString("fr-CI")} FCFA`,
              action: {
                label: "Voir",
                onClick: () => {
                  router.push(`/admin/orders/${newOrder.id}`);
                },
              },
              duration: 10000,
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playNotificationSound, router]);

  const handleClick = () => {
    setNewOrderCount(0);
    router.push("/admin/orders");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={handleClick}
    >
      <Bell className="size-5" />
      {newOrderCount > 0 && (
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {newOrderCount > 9 ? "9+" : newOrderCount}
        </span>
      )}
    </Button>
  );
}
