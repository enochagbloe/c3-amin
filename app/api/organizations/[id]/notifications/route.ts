import { requestContext } from "@/lib/budget-requests/access";
import { requestResponse } from "@/lib/budget-requests/http";
import { listNotifications, readNotifications } from "@/lib/budget-requests/notifications";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) { return requestResponse(async () => listNotifications(await requestContext((await params).id))); }
export async function PATCH(request: Request, { params }: Context) { return requestResponse(async () => readNotifications(await requestContext((await params).id), await request.json())); }