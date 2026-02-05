import { Metadata } from "next";
import { getStockAnalytics } from "@/actions/stock.actions";
import { StockDashboard } from "@/components/admin/stock-dashboard";

export const metadata: Metadata = {
  title: "Gestion des Stocks | La Teranga",
  description: "Gestion des stocks boissons, desserts et ingredients",
};

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const analytics = await getStockAnalytics();

  return <StockDashboard analytics={analytics} />;
}
