import { notFound, redirect } from "next/navigation";
import { getTableByToken, getActiveSession, validateSessionToken } from "@/actions/table.actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { TableMenuView } from "@/components/table/table-menu-view";

interface SessionMenuPageProps {
  params: Promise<{ token: string; sessionToken: string }>;
}

export default async function SessionMenuPage({ params }: SessionMenuPageProps) {
  const { token, sessionToken } = await params;

  // Verify table exists
  const table = await getTableByToken(token);
  if (!table) {
    notFound();
  }

  // Validate session token matches the active session
  const validation = await validateSessionToken(table.id, sessionToken);

  if (!validation.valid) {
    if (validation.reason === "expired" || validation.reason === "ended") {
      // Session ended - redirect to table welcome to start new session
      redirect(`/table/${token}`);
    }
    if (validation.reason === "invalid") {
      // Invalid session token - redirect to table welcome
      redirect(`/table/${token}`);
    }
    notFound();
  }

  const session = validation.session!;

  // Get menu categories with items
  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("menu_categories")
    .select(`
      id,
      name,
      slug,
      tab,
      menu_items (
        id,
        name,
        description,
        price,
        price_small,
        image_url,
        is_available
      )
    `)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Filter only available items
  const menuCategories = (categories ?? []).map((cat) => ({
    ...cat,
    items: (cat.menu_items as Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      price_small: number | null;
      image_url: string | null;
      is_available: boolean;
    }>).filter((item) => item.is_available),
  })).filter((cat) => cat.items.length > 0);

  return (
    <TableMenuView
      table={table}
      session={session}
      categories={menuCategories}
      tableToken={token}
      sessionToken={sessionToken}
    />
  );
}
