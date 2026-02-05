import { Metadata } from "next";
import { getSettings } from "@/actions/settings.actions";
import { SettingsManager } from "@/components/admin/settings-manager";

export const metadata: Metadata = {
  title: "Parametres | La Teranga Admin",
};

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Parametres</h1>
        <p className="text-sm text-muted-foreground">
          Configurez les parametres du restaurant
        </p>
      </div>

      <SettingsManager initialSettings={settings} />
    </div>
  );
}
