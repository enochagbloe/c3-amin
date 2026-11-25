import RequestsList from "@/components/budget-requests/RequestsList";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <RequestsList organizationId={(await params).id} />;
}
