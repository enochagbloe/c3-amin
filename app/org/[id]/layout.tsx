import OrgSidebar from "@/components/Nav/org/OrgSidebar";
import OrgNavBar from "@/components/Nav/org/orgNavBar";
import { OrganizationAccessProvider } from "@/components/organizations/OrganizationAccessProvider";
import { organizationAccess } from "@/lib/organizations/access";
import { UnauthorizedError } from "@/lib/http.error";
import { notFound, redirect } from "next/navigation";
export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  let access;
  try {
    access = await organizationAccess((await params).id);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/sign-in");
    notFound();
  }
  return (
    <OrganizationAccessProvider access={access}>
      <main>
        <OrgNavBar name={access.name} orgName={access.organizationName} />
        <div className="flex">
          <OrgSidebar orgName={access.organizationName} />
          <section className="flex max-h-screen min-w-0 flex-1 flex-col overflow-y-auto px-3 pb-3 pt-8 sm:px-6">
            <div>{children}</div>
          </section>
        </div>
      </main>
    </OrganizationAccessProvider>
  );
}
