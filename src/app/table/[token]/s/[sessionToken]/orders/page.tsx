import { notFound, redirect } from "next/navigation";
import { getTableByToken, validateSessionToken, getLastSession } from "@/actions/table.actions";
import { getSessionOrders } from "@/actions/order.actions";
import { TableOrdersView } from "@/components/table/table-orders-view";

interface SessionOrdersPageProps {
  params: Promise<{ token: string; sessionToken: string }>;
}

export default async function SessionOrdersPage({ params }: SessionOrdersPageProps) {
  const { token, sessionToken } = await params;

  // Verify table exists
  const table = await getTableByToken(token);
  if (!table) {
    notFound();
  }

  // Validate session token
  const validation = await validateSessionToken(table.id, sessionToken);

  let session = validation.session;
  let isSessionEnded = false;

  if (!validation.valid) {
    if (validation.reason === "expired" || validation.reason === "ended") {
      // Session ended - try to get session for receipts
      const lastSession = await getLastSession(table.id);
      if (lastSession && lastSession.session_token === sessionToken) {
        session = lastSession;
        isSessionEnded = true;
      } else {
        // Different session or no session - redirect to welcome
        redirect(`/table/${token}`);
      }
    } else {
      // Invalid session token
      redirect(`/table/${token}`);
    }
  }

  if (!session) {
    redirect(`/table/${token}`);
  }

  // Get orders for this session
  const ordersResult = await getSessionOrders(session.id);
  const orders = ordersResult.data ?? [];

  // If session ended but no orders, redirect to table welcome
  if (isSessionEnded && orders.length === 0) {
    redirect(`/table/${token}`);
  }

  return (
    <TableOrdersView
      table={table}
      session={session}
      orders={orders}
      tableToken={token}
      sessionToken={sessionToken}
      initialSessionEnded={isSessionEnded}
    />
  );
}
