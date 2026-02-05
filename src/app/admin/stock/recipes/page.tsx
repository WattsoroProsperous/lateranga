import { Metadata } from "next";
import { getRecipeIngredients, getIngredients } from "@/actions/stock.actions";
import { getMenuItems } from "@/actions/menu.actions";
import { RecipesManager } from "@/components/admin/recipes-manager";

export const metadata: Metadata = {
  title: "Recettes | La Teranga",
  description: "Gestion des recettes - lien entre plats et ingredients",
};

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const [recipesResult, ingredientsResult, menuItemsResult] = await Promise.all([
    getRecipeIngredients(),
    getIngredients(),
    getMenuItems(),
  ]);

  const recipes = recipesResult.data ?? [];
  const ingredients = ingredientsResult.data ?? [];
  const menuItems = menuItemsResult.data ?? [];

  // Filter to only show plats (dishes), not drinks or desserts
  const dishes = menuItems.filter((item: Record<string, unknown>) => {
    const category = item.category as { tab?: string } | undefined;
    return category?.tab === "plats";
  }) as typeof menuItems;

  return (
    <RecipesManager
      initialRecipes={recipes}
      ingredients={ingredients}
      menuItems={dishes}
    />
  );
}
