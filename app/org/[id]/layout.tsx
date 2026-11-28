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
      <main className="flex min-h-svh">
          <OrgSidebar orgName={access.organizationName} />
          <div className="min-w-0 flex-1">
          <OrgNavBar name={access.name} orgName={access.organizationName} />
          <section className="app-content min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </section>
        </div>
      </main>
    </OrganizationAccessProvider>
  );
}
