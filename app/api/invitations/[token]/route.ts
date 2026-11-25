import { requestResponse } from "@/lib/budget-requests/http";
import { invitationDetails, acceptInvitation } from "@/lib/invitations/service";
type Context = { params: Promise<{ token: string }> };
export async function GET(_: Request, { params }: Context) {
  return requestResponse(async () => invitationDetails((await params).token));
}
export async function POST(_: Request, { params }: Context) {
  return requestResponse(async () => acceptInvitation((await params).token));
}
