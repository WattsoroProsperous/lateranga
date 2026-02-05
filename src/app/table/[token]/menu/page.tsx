import { notFound } from "next/navigation";
import { getTableByToken, getActiveSession } from "@/actions/table.actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { TableMenuView } from "@/components/table/table-menu-view";

interface TableMenuPageProps {
  params: Promise<{ token: string }>;
}

export default async function TableMenuPage({ params }: TableMenuPageProps) {
  const { token } = await params;

  // Verify table exists
  const table = await getTableByToken(token);
  if (!table) {
    notFound();
  }

  // Check for active session
  const session = await getActiveSession(table.id);
  if (!session) {
    notFound();
  }

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
    />
  );
}
