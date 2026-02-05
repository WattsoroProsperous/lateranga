import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion | La Teranga",
  description: "Connectez-vous à votre compte La Teranga",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Connexion</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connectez-vous pour accéder à votre compte
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
