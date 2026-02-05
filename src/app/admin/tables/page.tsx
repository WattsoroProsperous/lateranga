import { Metadata } from "next";
import { getTablesWithStatus } from "@/actions/table.actions";
import { TablesManager } from "@/components/admin/tables-manager";

export const metadata: Metadata = {
  title: "Gestion des Tables | La Teranga Admin",
};

export default async function TablesPage() {
  const tables = await getTablesWithStatus();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestion des Tables</h1>
          <p className="text-sm text-muted-foreground">
            Gerez les tables et les QR codes pour les commandes sur place
          </p>
        </div>
      </div>

      <TablesManager initialTables={tables} />
    </div>
  );
}
