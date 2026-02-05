"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Store, Clock, Phone, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateSetting } from "@/actions/settings.actions";

interface SettingsManagerProps {
  initialSettings: { data?: Record<string, unknown>; error?: string };
}

interface RestaurantInfo {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
}

interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

interface DeliverySettings {
  enabled: boolean;
  minOrder: number;
  fee: number;
  zones: string[];
}

const defaultInfo: RestaurantInfo = {
  name: "La Teranga",
  description: "Restaurant Senegalais authentique a Abidjan",
  phone: "+225 07 00 00 00 00",
  email: "contact@lateranga.ci",
  address: "Rue 12, Treichville",
  city: "Abidjan",
  country: "Cote d'Ivoire",
};

const defaultHours: BusinessHours = {
  monday: { open: "11:00", close: "22:00", closed: false },
  tuesday: { open: "11:00", close: "22:00", closed: false },
  wednesday: { open: "11:00", close: "22:00", closed: false },
  thursday: { open: "11:00", close: "22:00", closed: false },
  friday: { open: "11:00", close: "23:00", closed: false },
  saturday: { open: "11:00", close: "23:00", closed: false },
  sunday: { open: "12:00", close: "21:00", closed: false },
};

const defaultDelivery: DeliverySettings = {
  enabled: true,
  minOrder: 5000,
  fee: 1000,
  zones: ["Treichville", "Marcory", "Koumassi", "Port-Bouet"],
};

const dayLabels: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [info, setInfo] = useState<RestaurantInfo>(
    (initialSettings.data?.restaurant_info as RestaurantInfo) || defaultInfo
  );
  const [hours, setHours] = useState<BusinessHours>(
    (initialSettings.data?.business_hours as BusinessHours) || defaultHours
  );
  const [delivery, setDelivery] = useState<DeliverySettings>(
    (initialSettings.data?.delivery_settings as DeliverySettings) || defaultDelivery
  );

  const handleSaveInfo = () => {
    startTransition(async () => {
      const result = await updateSetting("restaurant_info", info);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Informations mises a jour");
      router.refresh();
    });
  };

  const handleSaveHours = () => {
    startTransition(async () => {
      const result = await updateSetting("business_hours", hours);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Horaires mis a jour");
      router.refresh();
    });
  };

  const handleSaveDelivery = () => {
    startTransition(async () => {
      const result = await updateSetting("delivery_settings", delivery);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Parametres de livraison mis a jour");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Restaurant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-5" />
            Informations du Restaurant
          </CardTitle>
          <CardDescription>
            Informations generales affichees sur le site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du restaurant</Label>
            <Input
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={info.description}
              onChange={(e) => setInfo({ ...info, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telephone</Label>
              <Input
                value={info.phone}
                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={info.city}
                onChange={(e) => setInfo({ ...info, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input
                value={info.country}
                onChange={(e) => setInfo({ ...info, country: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleSaveInfo} disabled={isPending} className="w-full">
            <Save className="size-4 mr-2" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Horaires d&apos;ouverture
          </CardTitle>
          <CardDescription>
            Definissez vos heures d&apos;ouverture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(hours).map(([day, schedule]) => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-20 text-sm font-medium">{dayLabels[day]}</span>
              <Switch
                checked={!schedule.closed}
                onCheckedChange={(checked: boolean) =>
                  setHours({
                    ...hours,
                    [day]: { ...schedule, closed: !checked },
                  })
                }
              />
              {!schedule.closed && (
                <>
                  <Input
                    type="time"
                    value={schedule.open}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        [day]: { ...schedule, open: e.target.value },
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={schedule.close}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        [day]: { ...schedule, close: e.target.value },
                      })
                    }
                    className="w-24"
                  />
                </>
              )}
              {schedule.closed && (
                <span className="text-sm text-muted-foreground">Ferme</span>
              )}
            </div>
          ))}
          <Button onClick={handleSaveHours} disabled={isPending} className="w-full mt-4">
            <Save className="size-4 mr-2" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Parametres de livraison
          </CardTitle>
          <CardDescription>
            Configurez les options de livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Livraison activee</Label>
                <Switch
                  checked={delivery.enabled}
                  onCheckedChange={(checked: boolean) =>
                    setDelivery({ ...delivery, enabled: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Commande minimum (FCFA)</Label>
                <Input
                  type="number"
                  value={delivery.minOrder}
                  onChange={(e) =>
                    setDelivery({ ...delivery, minOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Frais de livraison (FCFA)</Label>
                <Input
                  type="number"
                  value={delivery.fee}
                  onChange={(e) =>
                    setDelivery({ ...delivery, fee: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zones de livraison (une par ligne)</Label>
              <Textarea
                value={delivery.zones.join("\n")}
                onChange={(e) =>
                  setDelivery({
                    ...delivery,
                    zones: e.target.value.split("\n").filter(Boolean),
                  })
                }
                rows={6}
                placeholder="Treichville&#10;Marcory&#10;Koumassi"
              />
            </div>
          </div>
          <Button onClick={handleSaveDelivery} disabled={isPending} className="w-full mt-4">
            <Save className="size-4 mr-2" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
