import { notFound } from "next/navigation";
import { getTableByToken, getActiveSession } from "@/actions/table.actions";
import { getSessionOrders } from "@/actions/order.actions";
import { TableOrdersView } from "@/components/table/table-orders-view";

interface TableOrdersPageProps {
  params: Promise<{ token: string }>;
}

export default async function TableOrdersPage({ params }: TableOrdersPageProps) {
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

  // Get orders for this session
  const ordersResult = await getSessionOrders(session.id);
  const orders = ordersResult.data ?? [];

  return (
    <TableOrdersView
      table={table}
      session={session}
      orders={orders}
      tableToken={token}
    />
  );
}
