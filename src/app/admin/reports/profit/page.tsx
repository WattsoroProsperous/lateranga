import { redirect } from "next/navigation";
import { hasRole } from "@/lib/supabase/admin";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import {
  getDailyProfit,
  getProfitSummary,
  getItemProfitMargins,
  getPeakHoursAnalysis,
  getTrendAnalysis,
} from "@/actions/reports.actions";
import { ProfitDashboardClient } from "./profit-dashboard-client";

export const metadata = {
  title: "Benefices | La Teranga Admin",
  description: "Analyse des benefices et marges",
};

export default async function ProfitPage() {
  const canAccess = await hasRole(MANAGER_ROLES);
  if (!canAccess) {
    redirect("/admin");
  }

  const [summary, dailyProfit, itemMargins, peakHours, trends] = await Promise.all([
    getProfitSummary("month"),
    getDailyProfit(30),
    getItemProfitMargins(),
    getPeakHoursAnalysis(30),
    getTrendAnalysis(4),
  ]);

  return (
    <ProfitDashboardClient
      summary={summary}
      dailyProfit={dailyProfit}
      itemMargins={itemMargins}
      peakHours={peakHours}
      trends={trends}
    />
  );
}
