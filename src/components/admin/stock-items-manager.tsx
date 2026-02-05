"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Package, AlertTriangle, ArrowLeft, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createStockItem, updateStockItem, deleteStockItem, adjustStock } from "@/actions/stock.actions";
import type { StockItem } from "@/types";

interface StockItemsManagerProps {
  initialItems: StockItem[];
}

const STOCK_UNITS = [
  { value: "unit", label: "Unite" },
  { value: "kg", label: "Kilogramme (kg)" },
  { value: "g", label: "Gramme (g)" },
  { value: "l", label: "Litre (L)" },
  { value: "ml", label: "Millilitre (ml)" },
  { value: "piece", label: "Piece" },
] as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " F";
}

function getUnitLabel(unit: string) {
  const found = STOCK_UNITS.find((u) => u.value === unit);
  return found ? found.label.split(" ")[0] : unit;
}

export function StockItemsManager({ initialItems }: StockItemsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"restock" | "waste" | "adjustment">("restock");

  const [formData, setFormData] = useState({
    name: "",
    current_quantity: 0,
    unit: "unit",
    min_threshold: 5,
    cost_per_unit: 0,
  });

  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    note: "",
  });

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({
      name: "",
      current_quantity: 0,
      unit: "unit",
      min_threshold: 5,
      cost_per_unit: 0,
    });
    setShowAddDialog(true);
  };

  const handleEdit = (item: StockItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      current_quantity: item.current_quantity,
      unit: item.unit,
      min_threshold: item.min_threshold,
      cost_per_unit: item.cost_per_unit,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (item: StockItem) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleAdjust = (item: StockItem, type: "restock" | "waste" | "adjustment") => {
    setSelectedItem(item);
    setAdjustmentType(type);
    setAdjustmentData({ quantity: 0, note: "" });
    setShowAdjustDialog(true);
  };

  const submitAdd = () => {
    startTransition(async () => {
      const result = await createStockItem(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Article ajoute avec succes");
      setShowAddDialog(false);
      router.refresh();
    });
  };

  const submitEdit = () => {
    if (!selectedItem) return;

    startTransition(async () => {
      const result = await updateStockItem({
        id: selectedItem.id,
        ...formData,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Article modifie avec succes");
      setShowEditDialog(false);
      router.refresh();
    });
  };

  const submitDelete = () => {
    if (!selectedItem) return;

    startTransition(async () => {
      const result = await deleteStockItem(selectedItem.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Article supprime");
      setShowDeleteDialog(false);
      router.refresh();
    });
  };

  const submitAdjustment = () => {
    if (!selectedItem || adjustmentData.quantity <= 0) return;

    startTransition(async () => {
      const result = await adjustStock({
        stock_item_id: selectedItem.id,
        movement_type: adjustmentType,
        quantity: adjustmentData.quantity,
        note: adjustmentData.note || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        adjustmentType === "restock"
          ? "Stock reapprovisionne"
          : adjustmentType === "waste"
          ? "Perte enregistree"
          : "Ajustement effectue"
      );
      setShowAdjustDialog(false);
      router.refresh();
    });
  };

  const lowStockCount = items.filter((i) => i.current_quantity <= i.min_threshold).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/stock">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Boissons & Desserts</h1>
            <p className="text-muted-foreground">
              Gerez le stock des articles comptables
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Stock Bas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(items.reduce((sum, i) => sum + i.current_quantity * i.cost_per_unit, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead className="text-center">Quantite</TableHead>
                  <TableHead className="text-center">Seuil Min.</TableHead>
                  <TableHead className="text-right">Cout Unite</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Aucun article trouve
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.current_quantity <= item.min_threshold;
                    const value = item.current_quantity * item.cost_per_unit;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={isLowStock ? "text-destructive font-medium" : ""}>
                            {item.current_quantity} {getUnitLabel(item.unit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {item.min_threshold} {getUnitLabel(item.unit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.cost_per_unit)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(value)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isLowStock ? (
                            <Badge variant="destructive">Stock Bas</Badge>
                          ) : item.is_active ? (
                            <Badge variant="default">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAdjust(item, "restock")}>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Reapprovisionner
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAdjust(item, "waste")}>
                                <TrendingDown className="h-4 w-4 mr-2" />
                                Enregistrer perte
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAdjust(item, "adjustment")}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Ajuster stock
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(item)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un article</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel article au stock (boisson ou dessert)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'article</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Coca-Cola 33cl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantite initiale</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.current_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, current_quantity: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unite</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="threshold">Seuil d'alerte</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  value={formData.min_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cout unitaire (FCFA)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_per_unit: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={submitAdd} disabled={isPending || !formData.name}>
              {isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'article
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom de l'article</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantite</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={formData.current_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, current_quantity: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unite</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-threshold">Seuil d'alerte</Label>
                <Input
                  id="edit-threshold"
                  type="number"
                  min="0"
                  value={formData.min_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cost">Cout unitaire (FCFA)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_per_unit: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={submitEdit} disabled={isPending || !formData.name}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'article</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer "{selectedItem?.name}" ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={submitDelete} disabled={isPending}>
              {isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === "restock"
                ? "Reapprovisionner"
                : adjustmentType === "waste"
                ? "Enregistrer une perte"
                : "Ajuster le stock"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.name} - Stock actuel: {selectedItem?.current_quantity}{" "}
              {selectedItem && getUnitLabel(selectedItem.unit)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjust-quantity">
                {adjustmentType === "restock"
                  ? "Quantite a ajouter"
                  : adjustmentType === "waste"
                  ? "Quantite perdue"
                  : "Quantite (+ ou -)"}
              </Label>
              <Input
                id="adjust-quantity"
                type="number"
                min={adjustmentType === "adjustment" ? undefined : "0"}
                value={adjustmentData.quantity}
                onChange={(e) =>
                  setAdjustmentData({ ...adjustmentData, quantity: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-note">Note (optionnel)</Label>
              <Input
                id="adjust-note"
                value={adjustmentData.note}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, note: e.target.value })}
                placeholder="Raison du mouvement..."
              />
            </div>
            {selectedItem && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Nouveau stock: </span>
                  <span className="font-medium">
                    {adjustmentType === "restock"
                      ? selectedItem.current_quantity + adjustmentData.quantity
                      : adjustmentType === "waste"
                      ? Math.max(0, selectedItem.current_quantity - Math.abs(adjustmentData.quantity))
                      : selectedItem.current_quantity + adjustmentData.quantity}{" "}
                    {getUnitLabel(selectedItem.unit)}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Annuler
            </Button>
            <Button onClick={submitAdjustment} disabled={isPending || adjustmentData.quantity === 0}>
              {isPending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
