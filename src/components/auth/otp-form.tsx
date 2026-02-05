"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyOtp } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function OtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (token.length !== 6) return;

    setError(null);
    setIsSubmitting(true);

    const result = await verifyOtp({ email, token });
    if (result?.error) {
      setError(result.error);
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          Un code de vérification a été envoyé à
        </p>
        <p className="font-medium">{email || "votre adresse email"}</p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={token}
          onChange={setToken}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || token.length !== 6}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Vérification...
          </>
        ) : (
          "Vérifier"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
