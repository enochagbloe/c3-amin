import { ChatProvider } from "@/lib/context/ChatContext";
import { organizationPageAccess } from "@/lib/organizations/page-access";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await organizationPageAccess((await params).id);
  return <ChatProvider>{children}</ChatProvider>;
}
