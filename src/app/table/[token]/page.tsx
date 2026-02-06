import { notFound } from "next/navigation";
import { getTableByToken, createTableSession } from "@/actions/table.actions";
import { TableWelcome } from "@/components/table/table-welcome";
import { TableSessionInProgress } from "@/components/table/table-session-in-progress";

interface TablePageProps {
  params: Promise<{ token: string }>;
}

export default async function TablePage({ params }: TablePageProps) {
  const { token } = await params;

  // Verify table exists and is active
  const table = await getTableByToken(token);

  if (!table) {
    notFound();
  }

  // Create or get session
  const result = await createTableSession(token);

  if (result.error || !result.session) {
    notFound();
  }

  // If there's an active session in progress (by another customer)
  if (result.sessionInProgress) {
    return (
      <TableSessionInProgress
        table={result.table!}
        session={result.session}
      />
    );
  }

  // New session created - show welcome with unique session URL
  return (
    <TableWelcome
      table={result.table!}
      session={result.session}
      tableToken={token}
    />
  );
}
