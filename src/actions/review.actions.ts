"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isCurrentUserAdmin } from "@/lib/supabase/admin";
import { createReviewSchema, moderateReviewSchema } from "@/lib/validations/review.schema";
import { revalidatePath } from "next/cache";
import type { Review } from "@/types";

export async function getFeaturedReviews() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_approved", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) return { error: error.message };
  return { data: data as Review[] };
}

export async function getAllReviews() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data: data as Review[] };
}

export async function createReview(input: unknown) {
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const initials = parsed.data.author_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const supabase = createAdminClient();
  const { error } = await supabase.from("reviews").insert({
    ...parsed.data,
    author_initials: initials,
    customer_id: user?.id ?? null,
    source: "website" as const,
    is_approved: false,
    is_featured: false,
  } as never);

  if (error) return { error: error.message };

  return { success: true, message: "Merci pour votre avis ! Il sera publie apres moderation." };
}

export async function moderateReview(input: unknown) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const parsed = moderateReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: parsed.data.is_approved } as never)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { success: true };
}

export async function toggleReviewFeatured(id: string, isFeatured: boolean) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_featured: isFeatured } as never)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { success: true };
}

export async function deleteReview(id: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "Non autorise" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { success: true };
}
