import { RegisterForm } from "@/components/auth/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte | La Teranga",
  description: "Créez votre compte La Teranga pour passer commande",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Créer un compte</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inscrivez-vous pour passer vos commandes en ligne
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
