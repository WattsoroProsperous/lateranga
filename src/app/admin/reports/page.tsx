import {
  getDailyRevenue,
  getPopularItems,
  getOrderTypesDistribution,
  getReportsSummary,
} from "@/actions/reports.actions";
import { ReportsDashboard } from "@/components/admin/reports-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rapports | Admin La Teranga",
};

export default async function ReportsPage() {
  const [dailyRevenue, popularItems, orderTypes, summary] = await Promise.all([
    getDailyRevenue(30),
    getPopularItems(10),
    getOrderTypesDistribution(),
    getReportsSummary("month"),
  ]);

  return (
    <ReportsDashboard
      dailyRevenue={dailyRevenue}
      popularItems={popularItems}
      orderTypes={orderTypes}
      summary={summary}
    />
  );
}
