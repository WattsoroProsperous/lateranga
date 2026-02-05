import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewsTable } from "@/components/admin/reviews-table";
import type { Review } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avis | Admin La Teranga",
};

export default async function AdminReviewsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  return <ReviewsTable reviews={(data ?? []) as Review[]} />;
}
