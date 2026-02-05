import { notFound, redirect } from "next/navigation";
import { getTableByToken, createTableSession } from "@/actions/table.actions";
import { TableWelcome } from "@/components/table/table-welcome";

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

  return (
    <TableWelcome
      table={result.table!}
      session={result.session}
      tableToken={token}
    />
  );
}
