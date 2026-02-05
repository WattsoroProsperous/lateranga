import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const signUpSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères"),
    email: z.string().email("Adresse email invalide"),
    phone: z
      .string()
      .regex(/^\+?225?\d{10}$/, "Numéro de téléphone invalide (format +225XXXXXXXXXX)")
      .optional()
      .or(z.literal("")),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  token: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
