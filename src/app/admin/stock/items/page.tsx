import { Metadata } from "next";
import { getStockItems } from "@/actions/stock.actions";
import { StockItemsManager } from "@/components/admin/stock-items-manager";

export const metadata: Metadata = {
  title: "Stock Boissons & Desserts | La Teranga",
  description: "Gestion du stock des boissons et desserts",
};

export const dynamic = "force-dynamic";

export default async function StockItemsPage() {
  const result = await getStockItems();
  const items = result.data ?? [];

  return <StockItemsManager initialItems={items} />;
}
