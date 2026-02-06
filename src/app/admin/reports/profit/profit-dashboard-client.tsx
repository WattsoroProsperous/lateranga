"use client";

import { useCallback } from "react";
import { ProfitDashboard } from "@/components/admin/profit-dashboard";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import { toast } from "sonner";
import type {
  DailyProfitData,
  ProfitSummary,
  ItemProfitData,
  PeakHourData,
} from "@/actions/reports.actions";

interface ProfitDashboardClientProps {
  summary: ProfitSummary;
  dailyProfit: DailyProfitData[];
  itemMargins: ItemProfitData[];
  peakHours: PeakHourData[];
  trends: Array<{
    week: number;
    startDate: string;
    endDate: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
    avgOrderValue: number;
  }>;
}

export function ProfitDashboardClient({
  summary,
  dailyProfit,
  itemMargins,
  peakHours,
  trends,
}: ProfitDashboardClientProps) {
  const handleExport = useCallback(
    (format: "pdf" | "excel") => {
      try {
        const exportData = {
          summary,
          dailyData: dailyProfit,
          topItems: itemMargins,
          peakHours,
          trends,
        };

        if (format === "pdf") {
          exportToPDF(exportData, "Rapport des Benefices - La Teranga");
          toast.success("Rapport PDF telecharge avec succes");
        } else {
          exportToExcel(exportData, "Rapport des Benefices - La Teranga");
          toast.success("Rapport Excel telecharge avec succes");
        }
      } catch (error) {
        console.error("Export error:", error);
        toast.error("Erreur lors de l'export du rapport");
      }
    },
    [summary, dailyProfit, itemMargins, peakHours, trends]
  );

  return (
    <ProfitDashboard
      summary={summary}
      dailyProfit={dailyProfit}
      itemMargins={itemMargins}
      peakHours={peakHours}
      trends={trends}
      onExport={handleExport}
    />
  );
}
