"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, QrCode, Users, MapPin, Trash2, RefreshCw, Eye, X } from "lucide-react";
import { cn, formatXOF } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createTable, updateTable, deleteTable, regenerateQRToken, endTableSession } from "@/actions/table.actions";
import type { RestaurantTable, TableSession, TableLocation } from "@/types/database.types";
import { ManagerOnly } from "@/components/auth/role-guard";

interface TableWithStatus extends RestaurantTable {
  active_session: TableSession | null;
  pending_orders: number;
}

interface TablesManagerProps {
  initialTables: TableWithStatus[];
}

const locationLabels: Record<TableLocation, string> = {
  interieur: "Interieur",
  terrasse: "Terrasse",
  vip: "VIP",
};

const locationColors: Record<TableLocation, string> = {
  interieur: "bg-blue-500/10 text-blue-600",
  terrasse: "bg-green-500/10 text-green-600",
  vip: "bg-purple-500/10 text-purple-600",
};

export function TablesManager({ initialTables }: TablesManagerProps) {
  const router = useRouter();
  const [tables, setTables] = useState<TableWithStatus[]>(initialTables);
  const [isPending, startTransition] = useTransition();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState<TableWithStatus | null>(null);
  const [newTable, setNewTable] = useState({
    table_number: "",
    name: "",
    capacity: "4",
    location: "interieur" as TableLocation,
  });

  const handleAddTable = () => {
    if (!newTable.table_number || !newTable.name) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    startTransition(async () => {
      const result = await createTable({
        table_number: parseInt(newTable.table_number),
        name: newTable.name,
        capacity: parseInt(newTable.capacity),
        location: newTable.location,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Table ajoutee avec succes");
      setShowAddDialog(false);
      setNewTable({ table_number: "", name: "", capacity: "4", location: "interieur" });
      router.refresh();
    });
  };

  const handleToggleActive = (table: TableWithStatus) => {
    startTransition(async () => {
      const result = await updateTable(table.id, { is_active: !table.is_active });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(table.is_active ? "Table desactivee" : "Table activee");
      router.refresh();
    });
  };

  const handleDelete = (table: TableWithStatus) => {
    if (!confirm(`Supprimer la table "${table.name}" ?`)) return;

    startTransition(async () => {
      const result = await deleteTable(table.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Table supprimee");
      router.refresh();
    });
  };

  const handleRegenerateQR = (table: TableWithStatus) => {
    if (!confirm("Regenerer le QR code ? L'ancien lien ne fonctionnera plus.")) return;

    startTransition(async () => {
      const result = await regenerateQRToken(table.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("QR code regenere");
      router.refresh();
    });
  };

  const handleEndSession = (table: TableWithStatus) => {
    if (!table.active_session) return;
    if (!confirm("Terminer la session de cette table ?")) return;

    startTransition(async () => {
      const result = await endTableSession(table.active_session!.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Session terminee");
      router.refresh();
    });
  };

  const getQRCodeUrl = (table: TableWithStatus) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/table/${table.qr_code_token}`;
  };

  const handleDownloadQR = async (table: TableWithStatus) => {
    const url = getQRCodeUrl(table);
    // Using QR Code API service
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `qr-table-${table.table_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      toast.success("QR code telecharge");
    } catch {
      toast.error("Erreur lors du telechargement");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Tables</p>
          <p className="text-2xl font-bold">{tables.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Tables Occupees</p>
          <p className="text-2xl font-bold text-green-600">
            {tables.filter(t => t.active_session).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Commandes en cours</p>
          <p className="text-2xl font-bold text-orange-600">
            {tables.reduce((sum, t) => sum + t.pending_orders, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Capacite Totale</p>
          <p className="text-2xl font-bold">
            {tables.reduce((sum, t) => sum + t.capacity, 0)} places
          </p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4 mr-2" />
          Ajouter une table
        </Button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={cn(
              "p-4 transition-all",
              !table.is_active && "opacity-50",
              table.active_session && "ring-2 ring-green-500"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{table.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    locationColors[table.location ?? "interieur"]
                  )}>
                    <MapPin className="size-3 inline mr-1" />
                    {locationLabels[table.location ?? "interieur"]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <Users className="size-3 inline mr-1" />
                    {table.capacity} places
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">
                #{table.table_number}
              </span>
            </div>

            {/* Session Status */}
            {table.active_session ? (
              <div className="bg-green-500/10 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Table occupee</p>
                    <p className="text-xs text-green-600">
                      Expire: {new Date(table.active_session.expires_at).toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {table.pending_orders > 0 && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      {table.pending_orders} commande{table.pending_orders > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => handleEndSession(table)}
                  disabled={isPending}
                >
                  <X className="size-3 mr-1" />
                  Terminer session
                </Button>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <p className="text-sm text-muted-foreground text-center">Table disponible</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setShowQRDialog(table)}
              >
                <QrCode className="size-4 mr-1" />
                QR Code
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleActive(table)}
                disabled={isPending}
              >
                {table.is_active ? "Desactiver" : "Activer"}
              </Button>
              <ManagerOnly>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(table)}
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </ManagerOnly>
            </div>
          </Card>
        ))}
      </div>

      {tables.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Aucune table configuree</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="size-4 mr-2" />
            Ajouter une table
          </Button>
        </Card>
      )}

      {/* Add Table Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Numero</label>
                <Input
                  type="number"
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Capacite</label>
                <Input
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  placeholder="4"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={newTable.name}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                placeholder="Table 1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Emplacement</label>
              <Select
                value={newTable.location}
                onValueChange={(v) => setNewTable({ ...newTable, location: v as TableLocation })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interieur">Interieur</SelectItem>
                  <SelectItem value="terrasse">Terrasse</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddTable} disabled={isPending}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!showQRDialog} onOpenChange={() => setShowQRDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {showQRDialog?.name}</DialogTitle>
          </DialogHeader>
          {showQRDialog && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getQRCodeUrl(showQRDialog))}`}
                  alt={`QR Code ${showQRDialog.name}`}
                  className="rounded-lg"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Lien de la table:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                  {getQRCodeUrl(showQRDialog)}
                </code>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleDownloadQR(showQRDialog)}
                >
                  Telecharger
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRegenerateQR(showQRDialog)}
                  disabled={isPending}
                >
                  <RefreshCw className="size-4 mr-1" />
                  Regenerer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
