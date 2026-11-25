import { requireOrganizationFinance, requireOrganizationOwner } from "./access";
import { UnauthorizedError } from "@/lib/http.error";
import { redirect } from "next/navigation";

export async function organizationPageAccess(
  organizationId: string,
  ownerOnly = false,
) {
  try {
    return await (ownerOnly
      ? requireOrganizationOwner(organizationId)
      : requireOrganizationFinance(organizationId));
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/sign-in");
    redirect(`/org/${organizationId}/budget-requests`);
  }
}
