"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema } from "@/lib/validations/auth.schema";

// Staff roles that can access admin panel
const STAFF_ROLES = ["super_admin", "admin", "cashier", "chef"];

export async function signIn(formData: { email: string; password: string }) {
  const parsed = signInSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("[signIn] Auth error:", error.message);
    return { error: "Email ou mot de passe incorrect" };
  }

  if (!data.user) {
    console.error("[signIn] No user returned after successful auth");
    return { error: "Erreur lors de la connexion" };
  }

  // Check user role and redirect accordingly
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    console.error("[signIn] Profile fetch error:", profileError.message);
  }

  // Return redirect path based on role
  const userRole = profile?.role;
  console.log("[signIn] User role:", userRole);

  if (userRole && STAFF_ROLES.includes(userRole)) {
    return { success: true, redirectTo: "/admin" };
  }

  return { success: true, redirectTo: "/" };
}

export async function signUp(formData: {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = signUpSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Un compte avec cet email existe déjà" };
    }
    return { error: "Erreur lors de la création du compte" };
  }

  return { success: true, message: "Vérifiez votre email pour confirmer votre compte" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function verifyOtp(formData: { email: string; token: string }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: formData.email,
    token: formData.token,
    type: "email",
  });

  if (error) {
    return { error: "Code de vérification invalide ou expiré" };
  }

  redirect("/");
}
