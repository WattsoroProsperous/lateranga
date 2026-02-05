import { Metadata } from "next";
import { getIngredients } from "@/actions/stock.actions";
import { IngredientsManager } from "@/components/admin/ingredients-manager";

export const metadata: Metadata = {
  title: "Ingredients Cuisine | La Teranga",
  description: "Gestion des ingredients de cuisine",
};

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const result = await getIngredients();
  const ingredients = result.data ?? [];

  return <IngredientsManager initialIngredients={ingredients} />;
}
