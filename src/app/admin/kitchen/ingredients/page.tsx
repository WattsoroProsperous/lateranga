import { redirect } from "next/navigation";
import { hasRole } from "@/lib/supabase/admin";
import { getIngredientsForChef, getTodayChefMovements } from "@/actions/stock.actions";
import { ChefIngredientWithdrawal } from "@/components/admin/chef-ingredient-withdrawal";
import type { UserRole } from "@/types";

export const metadata = {
  title: "Retrait Ingredients | La Teranga Admin",
  description: "Gestion des ingredients pour la cuisine",
};

export default async function ChefIngredientsPage() {
  // Chef, admin and super_admin can access
  const canAccess = await hasRole(["chef", "admin", "super_admin"] as UserRole[]);
  if (!canAccess) {
    redirect("/admin");
  }

  const [ingredientsResult, movementsResult] = await Promise.all([
    getIngredientsForChef(),
    getTodayChefMovements(),
  ]);

  if (ingredientsResult.error) {
    return (
      <div className="p-8">
        <p className="text-red-500">Erreur: {ingredientsResult.error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ChefIngredientWithdrawal
        weighableIngredients={ingredientsResult.weighable ?? []}
        unitIngredients={ingredientsResult.unit ?? []}
        todayMovements={movementsResult.data ?? []}
      />
    </div>
  );
}
