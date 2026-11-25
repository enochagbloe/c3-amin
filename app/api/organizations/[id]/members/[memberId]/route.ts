import { requestResponse } from "@/lib/budget-requests/http";
import { requireOrganizationOwner } from "@/lib/organizations/access";
import {
  updateOrganizationMemberRole,
  removeOrganizationMember,
} from "@/lib/actions/org/organization.actions";
import { RequestError, NotFoundError } from "@/lib/http.error";
import prisma from "@/lib/prisma";
import { z } from "zod";
type Context = { params: Promise<{ id: string; memberId: string }> };
async function target(params: Context["params"]) {
  const { id, memberId } = await params;
  await requireOrganizationOwner(id);
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: id },
  });
  if (!member) throw new NotFoundError("Member");
  return member;
}
export async function PUT(request: Request, { params }: Context) {
  return requestResponse(async () => {
    const member = await target(params);
    const { role } = z
      .object({ role: z.enum(["ADMIN", "MEMBER", "VIEWER"]) })
      .parse(await request.json());
    const result = await updateOrganizationMemberRole({
      memberId: member.id,
      role,
    });
    if (!result.success)
      throw new RequestError(
        400,
        result.error?.message ?? "Unable to change role",
      );
    return result.data;
  });
}
export async function DELETE(_: Request, { params }: Context) {
  return requestResponse(async () => {
    const member = await target(params);
    const result = await removeOrganizationMember({ memberId: member.id });
    if (!result.success)
      throw new RequestError(
        400,
        result.error?.message ?? "Unable to remove member",
      );
    return result.data;
  });
}
