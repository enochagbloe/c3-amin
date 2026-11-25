import { organizationPageAccess } from "@/lib/organizations/page-access";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await organizationPageAccess((await params).id, true);
  return children;
}
