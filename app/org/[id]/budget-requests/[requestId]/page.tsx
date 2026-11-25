import { auth } from "@/auth";
import RequestDetail from "@/components/budget-requests/RequestDetail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const session = await auth();
  return (
    <RequestDetail
      organizationId={id}
      requestId={requestId}
      userId={session?.user?.id ?? ""}
    />
  );
}
