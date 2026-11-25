import { requestContext } from "@/lib/budget-requests/access";
import { UnauthorizedError } from "@/lib/http.error";
import { redirect, notFound } from "next/navigation";

export default async function BudgetRequestsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  try {
    await requestContext((await params).id);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/sign-in");
    notFound();
  }
  return children;
}
