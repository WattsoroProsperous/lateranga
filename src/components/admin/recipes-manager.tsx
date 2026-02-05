"use client";

import { useState, useTransition, useMemo } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Search, Trash2, FileText, ArrowLeft, ChefHat } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createRecipeIngredient, updateRecipeIngredient, deleteRecipeIngredient } from "@/actions/stock.actions";
import type { Ingredient, MenuItem } from "@/types";

interface RecipeIngredientWithDetails {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity_used: number;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    price_per_unit: number;
  };
  menu_item: {
    id: string;
    name: string;
  };
}

interface RecipesManagerProps {
  initialRecipes: RecipeIngredientWithDetails[];
  ingredients: Ingredient[];
  menuItems: MenuItem[];
}

const STOCK_UNITS = [
  { value: "unit", label: "Unite" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "l", label: "L" },
  { value: "ml", label: "ml" },
  { value: "piece", label: "piece" },
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
  return found ? found.label : unit;
}

export function RecipesManager({
  initialRecipes,
  ingredients,
  menuItems,
}: RecipesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [selectedRecipeIngredient, setSelectedRecipeIngredient] = useState<RecipeIngredientWithDetails | null>(null);

  const [formData, setFormData] = useState({
    menu_item_id: "",
    ingredient_id: "",
    quantity_used: 0,
  });

  // Group recipes by menu item
  const recipesByMenuItem = useMemo(() => {
    const grouped: Record<string, RecipeIngredientWithDetails[]> = {};
    for (const recipe of initialRecipes) {
      const menuItemId = recipe.menu_item_id;
      if (!grouped[menuItemId]) {
        grouped[menuItemId] = [];
      }
      grouped[menuItemId].push(recipe);
    }
    return grouped;
  }, [initialRecipes]);

  // Filter menu items by search
  const filteredMenuItems = useMemo(() => {
    const itemsWithRecipes = menuItems.filter((item) => {
      const hasRecipe = recipesByMenuItem[item.id]?.length > 0;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return searchQuery ? matchesSearch : true;
    });
    return itemsWithRecipes;
  }, [menuItems, recipesByMenuItem, searchQuery]);

  // Calculate cost for a menu item based on its recipe
  const calculateRecipeCost = (menuItemId: string) => {
    const recipes = recipesByMenuItem[menuItemId] || [];
    return recipes.reduce((total, recipe) => {
      return total + recipe.quantity_used * recipe.ingredient.price_per_unit;
    }, 0);
  };

  const handleAddToRecipe = (menuItemId: string) => {
    setFormData({
      menu_item_id: menuItemId,
      ingredient_id: "",
      quantity_used: 0,
    });
    setSelectedMenuItem(menuItemId);
    setShowAddDialog(true);
  };

  const handleDelete = (recipe: RecipeIngredientWithDetails) => {
    setSelectedRecipeIngredient(recipe);
    setShowDeleteDialog(true);
  };

  const submitAdd = () => {
    if (!formData.ingredient_id || formData.quantity_used <= 0) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    startTransition(async () => {
      const result = await createRecipeIngredient(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ingredient ajoute a la recette");
      setShowAddDialog(false);
      router.refresh();
    });
  };

  const submitDelete = () => {
    if (!selectedRecipeIngredient) return;

    startTransition(async () => {
      const result = await deleteRecipeIngredient(selectedRecipeIngredient.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ingredient retire de la recette");
      setShowDeleteDialog(false);
      router.refresh();
    });
  };

  // Get available ingredients for a menu item (not already in recipe)
  const getAvailableIngredients = (menuItemId: string) => {
    const existingIngredientIds = (recipesByMenuItem[menuItemId] || []).map(
      (r) => r.ingredient_id
    );
    return ingredients.filter((i) => !existingIngredientIds.includes(i.id));
  };

  const selectedMenuItemData = menuItems.find((m) => m.id === selectedMenuItem);
  const availableIngredients = getAvailableIngredients(selectedMenuItem);

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
            <h1 className="text-2xl font-bold tracking-tight">Recettes</h1>
            <p className="text-muted-foreground">
              Definissez les ingredients necessaires pour chaque plat
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plats avec Recette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(recipesByMenuItem).length}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {menuItems.length} plats
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingredients Utilises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(initialRecipes.map((r) => r.ingredient_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {ingredients.length} disponibles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cout Moyen/Recette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                Object.keys(recipesByMenuItem).length > 0
                  ? Object.keys(recipesByMenuItem).reduce(
                      (sum, id) => sum + calculateRecipeCost(id),
                      0
                    ) / Object.keys(recipesByMenuItem).length
                  : 0
              )}
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
                placeholder="Rechercher un plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun plat trouve</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filteredMenuItems.map((menuItem) => {
                const recipes = recipesByMenuItem[menuItem.id] || [];
                const recipeCost = calculateRecipeCost(menuItem.id);
                const profit = menuItem.price - recipeCost;

                return (
                  <AccordionItem key={menuItem.id} value={menuItem.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <ChefHat className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{menuItem.name}</span>
                          {recipes.length > 0 ? (
                            <Badge variant="secondary">
                              {recipes.length} ingredient{recipes.length > 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pas de recette</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Prix: {formatCurrency(menuItem.price)}
                          </span>
                          {recipes.length > 0 && (
                            <>
                              <span className="text-muted-foreground">
                                Cout: {formatCurrency(recipeCost)}
                              </span>
                              <span className={profit >= 0 ? "text-green-600" : "text-destructive"}>
                                Marge: {formatCurrency(profit)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4 space-y-4">
                        {recipes.length > 0 ? (
                          <div className="rounded-md border">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left p-3 font-medium">Ingredient</th>
                                  <th className="text-center p-3 font-medium">Quantite</th>
                                  <th className="text-right p-3 font-medium">Prix/Unite</th>
                                  <th className="text-right p-3 font-medium">Cout</th>
                                  <th className="w-[60px]"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {recipes.map((recipe) => {
                                  const cost = recipe.quantity_used * recipe.ingredient.price_per_unit;
                                  return (
                                    <tr key={recipe.id} className="border-b last:border-0">
                                      <td className="p-3">{recipe.ingredient.name}</td>
                                      <td className="p-3 text-center">
                                        {recipe.quantity_used} {getUnitLabel(recipe.ingredient.unit)}
                                      </td>
                                      <td className="p-3 text-right text-muted-foreground">
                                        {formatCurrency(recipe.ingredient.price_per_unit)}/{getUnitLabel(recipe.ingredient.unit)}
                                      </td>
                                      <td className="p-3 text-right font-medium">
                                        {formatCurrency(cost)}
                                      </td>
                                      <td className="p-3">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive"
                                          onClick={() => handleDelete(recipe)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-muted/30">
                                  <td colSpan={3} className="p-3 font-medium">
                                    Total Cout Recette
                                  </td>
                                  <td className="p-3 text-right font-bold">
                                    {formatCurrency(recipeCost)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Aucun ingredient defini pour ce plat.
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToRecipe(menuItem.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter un ingredient
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Add Ingredient Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un ingredient</DialogTitle>
            <DialogDescription>
              Ajoutez un ingredient a la recette de "{selectedMenuItemData?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ingredient">Ingredient</Label>
              <Select
                value={formData.ingredient_id}
                onValueChange={(value) => setFormData({ ...formData, ingredient_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {availableIngredients.length === 0 ? (
                    <SelectItem value="" disabled>
                      Aucun ingredient disponible
                    </SelectItem>
                  ) : (
                    availableIngredients.map((ingredient) => (
                      <SelectItem key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({formatCurrency(ingredient.price_per_unit)}/{getUnitLabel(ingredient.unit)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantite utilisee</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity_used}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity_used: parseFloat(e.target.value) || 0 })
                  }
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">
                  {formData.ingredient_id &&
                    getUnitLabel(
                      ingredients.find((i) => i.id === formData.ingredient_id)?.unit || ""
                    )}
                </span>
              </div>
            </div>
            {formData.ingredient_id && formData.quantity_used > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Cout de cet ingredient: </span>
                  <span className="font-medium">
                    {formatCurrency(
                      formData.quantity_used *
                        (ingredients.find((i) => i.id === formData.ingredient_id)?.price_per_unit || 0)
                    )}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={submitAdd}
              disabled={isPending || !formData.ingredient_id || formData.quantity_used <= 0}
            >
              {isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer l'ingredient</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir retirer "{selectedRecipeIngredient?.ingredient.name}" de cette
              recette ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={submitDelete} disabled={isPending}>
              {isPending ? "Suppression..." : "Retirer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
