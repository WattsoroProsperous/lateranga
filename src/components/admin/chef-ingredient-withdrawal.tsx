"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChefHat, Scale, Package, Minus, Clock, AlertTriangle, Search, History, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { chefWithdrawIngredient } from "@/actions/stock.actions";
import type { StockMovement } from "@/types";

interface IngredientForChef {
  id: string;
  name: string;
  description: string | null;
  current_quantity: number;
  unit: string;
  min_threshold: number;
  approval_threshold: number | null;
  ingredient_type: string;
}

interface ChefIngredientWithdrawalProps {
  weighableIngredients: IngredientForChef[];
  unitIngredients: IngredientForChef[];
  todayMovements: Array<StockMovement & {
    ingredient?: { id: string; name: string; unit: string } | null;
    performed_by_user?: { id: string; full_name: string } | null;
  }>;
}

const UNIT_LABELS: Record<string, string> = {
  unit: "unite",
  kg: "kg",
  g: "g",
  l: "L",
  ml: "ml",
  piece: "piece(s)",
};

function formatQuantity(qty: number, unit: string) {
  return `${qty.toFixed(unit === "unit" || unit === "piece" ? 0 : 2)} ${UNIT_LABELS[unit] ?? unit}`;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function ChefIngredientWithdrawal({
  weighableIngredients,
  unitIngredients,
  todayMovements,
}: ChefIngredientWithdrawalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientForChef | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"weighable" | "unit">("weighable");

  const [withdrawalData, setWithdrawalData] = useState({
    quantity: 0,
    note: "",
  });

  const filteredWeighable = weighableIngredients.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnit = unitIngredients.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectIngredient = (ingredient: IngredientForChef) => {
    setSelectedIngredient(ingredient);
    setWithdrawalData({ quantity: 0, note: "" });
    setShowWithdrawDialog(true);
  };

  const handleWithdraw = () => {
    if (!selectedIngredient) return;

    if (withdrawalData.quantity <= 0) {
      toast.error("Veuillez entrer une quantite valide");
      return;
    }

    if (withdrawalData.quantity > selectedIngredient.current_quantity) {
      toast.error(`Stock insuffisant. Disponible: ${formatQuantity(selectedIngredient.current_quantity, selectedIngredient.unit)}`);
      return;
    }

    startTransition(async () => {
      const result = await chefWithdrawIngredient({
        ingredient_id: selectedIngredient.id,
        quantity: withdrawalData.quantity,
        note: withdrawalData.note || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.needs_approval) {
        toast.warning(
          `Quantite importante: demande envoyee a l'admin pour approbation`,
          {
            description: result.message,
            duration: 5000,
          }
        );
        setShowWithdrawDialog(false);
        setSelectedIngredient(null);
        router.refresh();
      } else {
        toast.success(`${withdrawalData.quantity} ${UNIT_LABELS[selectedIngredient.unit]} de ${selectedIngredient.name} retire(s) du stock`);
        setShowWithdrawDialog(false);
        setSelectedIngredient(null);
        router.refresh();
      }
    });
  };

  const IngredientCard = ({ ingredient }: { ingredient: IngredientForChef }) => {
    const isLowStock = ingredient.current_quantity <= ingredient.min_threshold;

    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${isLowStock ? "border-orange-300 bg-orange-50" : ""}`}
        onClick={() => handleSelectIngredient(ingredient)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium">{ingredient.name}</h4>
              <p className="text-2xl font-bold mt-1">
                {formatQuantity(ingredient.current_quantity, ingredient.unit)}
              </p>
              {ingredient.description && (
                <p className="text-sm text-muted-foreground mt-1">{ingredient.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {ingredient.ingredient_type === "weighable" ? (
                <Badge variant="outline" className="gap-1">
                  <Scale className="h-3 w-3" />
                  Pesable
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  Unite
                </Badge>
              )}
              {isLowStock && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Stock bas
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Seuil min: {formatQuantity(ingredient.min_threshold, ingredient.unit)}
            </span>
            <Button variant="ghost" size="sm" className="gap-1">
              <Minus className="h-4 w-4" />
              Retirer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ChefHat className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Retrait Ingredients</h2>
            <p className="text-muted-foreground">
              Selectionnez un ingredient puis indiquez la quantite a retirer
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un ingredient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for ingredient types */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "weighable" | "unit")}>
        <TabsList className="mb-4">
          <TabsTrigger value="weighable" className="gap-2">
            <Scale className="h-4 w-4" />
            Pesables ({filteredWeighable.length})
          </TabsTrigger>
          <TabsTrigger value="unit" className="gap-2">
            <Package className="h-4 w-4" />
            Unites ({filteredUnit.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weighable">
          {filteredWeighable.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun ingredient pesable trouve
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredWeighable.map((ingredient) => (
                <IngredientCard key={ingredient.id} ingredient={ingredient} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unit">
          {filteredUnit.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun ingredient unite trouve
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUnit.map((ingredient) => (
                <IngredientCard key={ingredient.id} ingredient={ingredient} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Today's Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Retraits du jour
          </CardTitle>
          <CardDescription>
            Historique des ingredients retires aujourd'hui
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayMovements.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Aucun retrait effectue aujourd'hui
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heure</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Quantite</TableHead>
                  <TableHead>Par</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatTime(movement.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {movement.ingredient?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {Math.abs(movement.quantity)} {movement.ingredient?.unit ?? ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {movement.performed_by_user?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {movement.note ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIngredient?.ingredient_type === "weighable" ? (
                <Scale className="h-5 w-5" />
              ) : (
                <Package className="h-5 w-5" />
              )}
              Retirer: {selectedIngredient?.name}
            </DialogTitle>
            <DialogDescription>
              Stock actuel: {selectedIngredient && formatQuantity(selectedIngredient.current_quantity, selectedIngredient.unit)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantite a retirer ({selectedIngredient && UNIT_LABELS[selectedIngredient.unit]})
              </Label>
              <Input
                id="quantity"
                type="number"
                step={selectedIngredient?.ingredient_type === "weighable" ? "0.1" : "1"}
                min="0"
                max={selectedIngredient?.current_quantity}
                value={withdrawalData.quantity || ""}
                onChange={(e) =>
                  setWithdrawalData({ ...withdrawalData, quantity: parseFloat(e.target.value) || 0 })
                }
                placeholder={`Ex: ${selectedIngredient?.ingredient_type === "weighable" ? "0.5" : "1"}`}
              />
              {selectedIngredient?.ingredient_type === "weighable" && (
                <p className="text-xs text-muted-foreground">
                  Pesez l'ingredient et entrez le poids en {UNIT_LABELS[selectedIngredient.unit]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Textarea
                id="note"
                value={withdrawalData.note}
                onChange={(e) =>
                  setWithdrawalData({ ...withdrawalData, note: e.target.value })
                }
                placeholder="Ex: Pour le Thieboudienne du midi"
                rows={2}
              />
            </div>

            {selectedIngredient && withdrawalData.quantity > 0 && (
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Apres retrait:</span>{" "}
                    {formatQuantity(
                      Math.max(0, selectedIngredient.current_quantity - withdrawalData.quantity),
                      selectedIngredient.unit
                    )}
                  </p>
                  {selectedIngredient.current_quantity - withdrawalData.quantity <= selectedIngredient.min_threshold && (
                    <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Attention: Le stock sera en dessous du seuil minimum
                    </p>
                  )}
                </div>

                {selectedIngredient.approval_threshold !== null &&
                  withdrawalData.quantity > selectedIngredient.approval_threshold && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                      <span>
                        <strong>Approbation requise:</strong> Cette quantite ({withdrawalData.quantity}{" "}
                        {UNIT_LABELS[selectedIngredient.unit]}) depasse le seuil de{" "}
                        {selectedIngredient.approval_threshold} {UNIT_LABELS[selectedIngredient.unit]}.
                        La demande sera envoyee a l'admin pour validation.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleWithdraw} disabled={isPending || withdrawalData.quantity <= 0}>
              {isPending ? "Retrait..." : "Confirmer le retrait"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
