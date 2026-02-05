"use server";

import { createClient } from "@/lib/supabase/server";
import { createReviewSchema, moderateReviewSchema } from "@/lib/validations/review.schema";
import { revalidatePath } from "next/cache";
import type { Review } from "@/types";

export async function getFeaturedReviews() {
  const supabase = await createClient();
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

export async function createReview(input: unknown) {
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initials = parsed.data.author_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const { error } = await supabase.from("reviews").insert({
    ...parsed.data,
    author_initials: initials,
    customer_id: user?.id ?? null,
    source: "website" as const,
    is_approved: false,
    is_featured: false,
  } as never);

  if (error) return { error: error.message };

  return { success: true, message: "Merci pour votre avis ! Il sera publié après modération." };
}

export async function moderateReview(input: unknown) {
  const parsed = moderateReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: parsed.data.is_approved } as never)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { success: true };
}
