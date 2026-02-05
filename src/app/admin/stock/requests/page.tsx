import { Metadata } from "next";
import { getIngredientRequests, getIngredients } from "@/actions/stock.actions";
import { IngredientRequestsManager } from "@/components/admin/ingredient-requests-manager";

export const metadata: Metadata = {
  title: "Demandes Ingredients | La Teranga",
  description: "Gestion des demandes d'ingredients du chef",
};

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const [requestsResult, ingredientsResult] = await Promise.all([
    getIngredientRequests(),
    getIngredients(),
  ]);

  const requests = requestsResult.data ?? [];
  const ingredients = ingredientsResult.data ?? [];

  return (
    <IngredientRequestsManager
      initialRequests={requests}
      ingredients={ingredients}
    />
  );
}
