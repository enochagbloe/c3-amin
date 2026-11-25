import TeamPage from "@/components/team/TeamPage";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TeamPage organizationId={(await params).id} />;
}
