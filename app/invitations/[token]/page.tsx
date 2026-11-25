import AcceptInvitation from "@/components/team/AcceptInvitation";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return <AcceptInvitation token={(await params).token} />;
}
