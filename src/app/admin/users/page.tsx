import { Metadata } from "next";
import { getStaffMembers } from "@/lib/supabase/admin";
import { UsersManager } from "@/components/admin/users-manager";

export const metadata: Metadata = {
  title: "Gestion des Utilisateurs | La Teranga Admin",
};

export default async function UsersPage() {
  const users = await getStaffMembers();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Gestion des Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Gerez les membres du personnel et leurs roles
        </p>
      </div>

      <UsersManager initialUsers={users} />
    </div>
  );
}
