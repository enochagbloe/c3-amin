import { requestResponse } from "@/lib/budget-requests/http";
import { listInvitations, sendInvitation } from "@/lib/invitations/service";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  return requestResponse(async () => listInvitations((await params).id));
}
export async function POST(request: Request, { params }: Context) {
  return requestResponse(
    async () => sendInvitation((await params).id, await request.json()),
    201,
  );
}
