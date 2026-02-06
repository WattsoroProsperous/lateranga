"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ChefHat, AlertTriangle, ArrowLeft, TrendingUp, TrendingDown, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createIngredient, updateIngredient, deleteIngredient, adjustStock } from "@/actions/stock.actions";
import type { Ingredient } from "@/types";

interface IngredientsManagerProps {
  initialIngredients: Ingredient[];
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

export function IngredientsManager({ initialIngredients }: IngredientsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"restock" | "waste" | "adjustment">("restock");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    current_quantity: 0,
    unit: "kg",
    price_per_unit: 0,
    min_threshold: 1,
    approval_threshold: null as number | null,
    supplier: "",
  });

  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    note: "",
  });

  const filteredIngredients = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({
      name: "",
      description: "",
      current_quantity: 0,
      unit: "kg",
      price_per_unit: 0,
      min_threshold: 1,
      approval_threshold: null,
      supplier: "",
    });
    setShowAddDialog(true);
  };

  const handleEdit = (item: Ingredient) => {
    setSelectedIngredient(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      current_quantity: item.current_quantity,
      unit: item.unit,
      price_per_unit: item.price_per_unit,
      min_threshold: item.min_threshold,
      approval_threshold: item.approval_threshold,
      supplier: item.supplier || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (item: Ingredient) => {
    setSelectedIngredient(item);
    setShowDeleteDialog(true);
  };

  const handleAdjust = (item: Ingredient, type: "restock" | "waste" | "adjustment") => {
    setSelectedIngredient(item);
    setAdjustmentType(type);
    setAdjustmentData({ quantity: 0, note: "" });
    setShowAdjustDialog(true);
  };

  const submitAdd = () => {
    startTransition(async () => {
      const result = await createIngredient({
        ...formData,
        description: formData.description || null,
        supplier: formData.supplier || null,
        approval_threshold: formData.approval_threshold,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ingredient ajoute avec succes");
      setShowAddDialog(false);
      router.refresh();
    });
  };

  const submitEdit = () => {
    if (!selectedIngredient) return;

    startTransition(async () => {
      const result = await updateIngredient({
        id: selectedIngredient.id,
        ...formData,
        description: formData.description || null,
        supplier: formData.supplier || null,
        approval_threshold: formData.approval_threshold,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ingredient modifie avec succes");
      setShowEditDialog(false);
      router.refresh();
    });
  };

  const submitDelete = () => {
    if (!selectedIngredient) return;

    startTransition(async () => {
      const result = await deleteIngredient(selectedIngredient.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ingredient supprime");
      setShowDeleteDialog(false);
      router.refresh();
    });
  };

  const submitAdjustment = () => {
    if (!selectedIngredient || adjustmentData.quantity === 0) return;

    startTransition(async () => {
      const result = await adjustStock({
        ingredient_id: selectedIngredient.id,
        movement_type: adjustmentType,
        quantity: Math.abs(adjustmentData.quantity),
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

  const lowStockCount = ingredients.filter((i) => i.current_quantity <= i.min_threshold).length;

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
            <h1 className="text-2xl font-bold tracking-tight">Ingredients Cuisine</h1>
            <p className="text-muted-foreground">
              Gerez les ingredients pour la preparation des plats
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
            <CardTitle className="text-sm font-medium">Total Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredients.length}</div>
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
              {formatCurrency(ingredients.reduce((sum, i) => sum + i.current_quantity * i.price_per_unit, 0))}
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
                placeholder="Rechercher un ingredient..."
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
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-center">Quantite</TableHead>
                  <TableHead className="text-center">Seuil Min.</TableHead>
                  <TableHead className="text-center">Seuil Approbation</TableHead>
                  <TableHead className="text-right">Prix/Unite</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Aucun ingredient trouve
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIngredients.map((item) => {
                    const isLowStock = item.current_quantity <= item.min_threshold;
                    const value = item.current_quantity * item.price_per_unit;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.supplier || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={isLowStock ? "text-destructive font-medium" : ""}>
                            {item.current_quantity} {getUnitLabel(item.unit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {item.min_threshold} {getUnitLabel(item.unit)}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.approval_threshold !== null ? (
                            <Badge variant="outline" className="gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              {item.approval_threshold} {getUnitLabel(item.unit)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price_per_unit)}/{getUnitLabel(item.unit)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un ingredient</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel ingredient au stock cuisine
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'ingredient</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Oignons"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'ingredient..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantite initiale</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.current_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, current_quantity: parseFloat(e.target.value) || 0 })
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
                <Label htmlFor="price">Prix par unite (FCFA)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price_per_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_unit: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Seuil d'alerte</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.min_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, min_threshold: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval-threshold" className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Seuil d'approbation (optionnel)
              </Label>
              <Input
                id="approval-threshold"
                type="number"
                min="0"
                step="0.1"
                value={formData.approval_threshold ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    approval_threshold: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Ex: 5"
              />
              <p className="text-xs text-muted-foreground">
                Au-dela de cette quantite, le retrait par le chef necessite une approbation admin.
                Laissez vide pour aucune limite.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Fournisseur (optionnel)</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nom du fournisseur"
              />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'ingredient</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'ingredient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom de l'ingredient</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optionnel)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantite</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.current_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, current_quantity: parseFloat(e.target.value) || 0 })
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
                <Label htmlFor="edit-price">Prix par unite (FCFA)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  value={formData.price_per_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_unit: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-threshold">Seuil d'alerte</Label>
                <Input
                  id="edit-threshold"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.min_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, min_threshold: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-approval-threshold" className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Seuil d'approbation (optionnel)
              </Label>
              <Input
                id="edit-approval-threshold"
                type="number"
                min="0"
                step="0.1"
                value={formData.approval_threshold ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    approval_threshold: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Ex: 5"
              />
              <p className="text-xs text-muted-foreground">
                Au-dela de cette quantite, le retrait par le chef necessite une approbation admin.
                Laissez vide pour aucune limite.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-supplier">Fournisseur (optionnel)</Label>
              <Input
                id="edit-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
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
            <DialogTitle>Supprimer l'ingredient</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer "{selectedIngredient?.name}" ? Cette action est irreversible.
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
              {selectedIngredient?.name} - Stock actuel: {selectedIngredient?.current_quantity}{" "}
              {selectedIngredient && getUnitLabel(selectedIngredient.unit)}
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
                step="0.1"
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
            {selectedIngredient && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Nouveau stock: </span>
                  <span className="font-medium">
                    {adjustmentType === "restock"
                      ? selectedIngredient.current_quantity + adjustmentData.quantity
                      : adjustmentType === "waste"
                      ? Math.max(0, selectedIngredient.current_quantity - Math.abs(adjustmentData.quantity))
                      : selectedIngredient.current_quantity + adjustmentData.quantity}{" "}
                    {getUnitLabel(selectedIngredient.unit)}
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
