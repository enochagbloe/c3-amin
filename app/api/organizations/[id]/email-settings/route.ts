import { requestResponse } from "@/lib/budget-requests/http";
import { emailSettingsView } from "@/lib/invitations/email-settings";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  return requestResponse(async () => emailSettingsView((await params).id));
}
