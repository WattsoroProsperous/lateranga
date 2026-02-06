"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed, Clock, Users, MapPin, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { checkSessionStatus } from "@/actions/table.actions";
import type { RestaurantTable, TableSession } from "@/types/database.types";

interface TableSessionInProgressProps {
  table: RestaurantTable;
  session: TableSession;
}

const locationLabels: Record<string, string> = {
  interieur: "Interieur",
  terrasse: "Terrasse",
  vip: "VIP",
};

export function TableSessionInProgress({ table, session }: TableSessionInProgressProps) {
  const [isStillActive, setIsStillActive] = useState(true);

  // Poll to check if session ends
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkSessionStatus(session.id);
      if (!status.isActive) {
        setIsStillActive(false);
        // Reload page to create new session
        window.location.reload();
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [session.id]);

  const expiresAt = new Date(session.expires_at);
  const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60));

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center space-y-6">
        {/* Logo / Header */}
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="size-16 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="size-8 text-amber-600" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-amber-800">Table Occupee</h1>
          <p className="text-muted-foreground">Une session est deja en cours</p>
        </div>

        {/* Table Info */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-xl">{table.name}</h2>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {locationLabels[table.location ?? "interieur"]}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {table.capacity} places
            </span>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-amber-800">
            <Clock className="size-4" />
            <span>
              Session active pour encore{" "}
              <span className="font-bold">{timeRemaining} minutes</span>
            </span>
          </div>
          <p className="text-sm text-amber-700">
            Un autre client utilise actuellement cette table.
            Veuillez patienter ou contacter le personnel.
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Cette page se rafraichira automatiquement quand la table sera disponible.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="size-2 bg-amber-500 rounded-full animate-pulse" />
            <span>En attente de disponibilite...</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Si vous etes le client de cette table, demandez au serveur de terminer la session precedente.
        </p>
      </Card>
    </div>
  );
}
