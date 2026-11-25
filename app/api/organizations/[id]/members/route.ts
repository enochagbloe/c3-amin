import { requestResponse } from "@/lib/budget-requests/http";
import { requireOrganizationOwner } from "@/lib/organizations/access";
import { getOrganizationMembers } from "@/lib/actions/org/organization.actions";
import { sendInvitation } from "@/lib/invitations/service";
import { RequestError } from "@/lib/http.error";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  return requestResponse(async () => {
    const { id } = await params;
    await requireOrganizationOwner(id);
    const search = new URL(request.url).searchParams;
    const result = await getOrganizationMembers({
      organizationId: id,
      page: Number(search.get("page") ?? 1),
      pageSize: Number(search.get("pageSize") ?? 20),
    });
    if (!result.success)
      throw new RequestError(
        400,
        result.error?.message ?? "Unable to load members",
      );
    return result.data;
  });
}
export async function POST(request: Request, { params }: Context) {
  return requestResponse(
    async () => sendInvitation((await params).id, await request.json()),
    201,
  );
}
