import { notFound, redirect } from "next/navigation";
import { getTableByToken, getActiveSession } from "@/actions/table.actions";

interface TableMenuPageProps {
  params: Promise<{ token: string }>;
}

// This route redirects to the session-specific menu URL
// This ensures all users go through the proper session flow
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
    // No active session, redirect to welcome page to create one
    redirect(`/table/${token}`);
  }

  // Redirect to session-specific menu URL
  redirect(`/table/${token}/s/${session.session_token}/menu`);
}
