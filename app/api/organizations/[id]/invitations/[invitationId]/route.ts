import { requestResponse } from "@/lib/budget-requests/http";
import { revokeInvitation, checkDelivery } from "@/lib/invitations/service";
type Context = { params: Promise<{ id: string; invitationId: string }> };
export async function DELETE(_: Request, { params }: Context) {
  return requestResponse(async () => {
    const { id, invitationId } = await params;
    return revokeInvitation(id, invitationId);
  });
}
export async function GET(_: Request, { params }: Context) {
  return requestResponse(async () => {
    const { id, invitationId } = await params;
    return checkDelivery(id, invitationId);
  });
}
