import RequestForm from "@/components/budget-requests/RequestForm";
import Link from "next/link";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href={`/org/${id}/budget-requests`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Budget requests
      </Link>
      <RequestForm organizationId={id} />
    </main>
  );
}
