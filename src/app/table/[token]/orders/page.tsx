import { notFound, redirect } from "next/navigation";
import { getTableByToken, getActiveSession, getLastSession } from "@/actions/table.actions";

interface TableOrdersPageProps {
  params: Promise<{ token: string }>;
}

// This route redirects to the session-specific orders URL
// This ensures all users go through the proper session flow
export default async function TableOrdersPage({ params }: TableOrdersPageProps) {
  const { token } = await params;

  // Verify table exists
  const table = await getTableByToken(token);
  if (!table) {
    notFound();
  }

  // First try to get active session
  let session = await getActiveSession(table.id);

  // If no active session, try to get the last session (for viewing receipts)
  if (!session) {
    session = await getLastSession(table.id);
    if (!session) {
      // No session at all, redirect to table welcome page
      redirect(`/table/${token}`);
    }
  }

  // Redirect to session-specific orders URL
  redirect(`/table/${token}/s/${session.session_token}/orders`);
}
