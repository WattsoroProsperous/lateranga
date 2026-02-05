"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Clock, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTableSessionStore } from "@/stores/table-session-store";
import type { RestaurantTable, TableSession } from "@/types/database.types";

interface TableWelcomeProps {
  table: RestaurantTable;
  session: TableSession;
  tableToken: string;
}

const locationLabels: Record<string, string> = {
  interieur: "Interieur",
  terrasse: "Terrasse",
  vip: "VIP",
};

export function TableWelcome({ table, session, tableToken }: TableWelcomeProps) {
  const router = useRouter();
  const { setSession } = useTableSessionStore();

  useEffect(() => {
    // Store session in local storage
    setSession(session, table);
  }, [session, table, setSession]);

  const expiresAt = new Date(session.expires_at);
  const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60));

  const handleViewMenu = () => {
    router.push(`/table/${tableToken}/menu`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center space-y-6">
        {/* Logo / Header */}
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UtensilsCrossed className="size-8 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold">La Teranga</h1>
          <p className="text-muted-foreground">Restaurant Senegalais</p>
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
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock className="size-4 text-muted-foreground" />
          <span>
            Session active pour{" "}
            <span className="font-bold text-primary">{timeRemaining} minutes</span>
          </span>
        </div>

        {/* Instructions */}
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Bienvenue ! Vous pouvez commander directement depuis votre telephone.
          </p>
          <ol className="text-left space-y-2 pl-4">
            <li className="flex gap-2">
              <span className="flex-shrink-0 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Parcourez notre menu</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Ajoutez vos plats au panier</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Validez votre commande</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Payez a la caisse avec votre numero de commande</span>
            </li>
          </ol>
        </div>

        {/* CTA */}
        <Button onClick={handleViewMenu} size="lg" className="w-full">
          <UtensilsCrossed className="size-5 mr-2" />
          Voir le Menu
        </Button>

        <p className="text-xs text-muted-foreground">
          En continuant, vous acceptez nos conditions d&apos;utilisation
        </p>
      </Card>
    </div>
  );
}
