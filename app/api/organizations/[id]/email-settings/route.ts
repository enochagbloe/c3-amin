import { requestResponse } from "@/lib/budget-requests/http";
import {
  emailSettingsView,
  saveEmailSettings,
} from "@/lib/invitations/email-settings";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  return requestResponse(async () => emailSettingsView((await params).id));
}
export async function PUT(request: Request, { params }: Context) {
  return requestResponse(async () =>
    saveEmailSettings((await params).id, await request.json()),
  );
}
