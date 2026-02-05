import { OtpForm } from "@/components/auth/otp-form";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification | La Teranga",
  description: "Vérifiez votre adresse email",
};

export default function VerifyOtpPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Vérification</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entrez le code de vérification reçu par email
        </p>
      </div>
      <Suspense>
        <OtpForm />
      </Suspense>
    </div>
  );
}
