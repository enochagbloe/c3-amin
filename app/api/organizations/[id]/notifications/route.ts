import { requestContext } from "@/lib/budget-requests/access";
import { requestResponse } from "@/lib/budget-requests/http";
import { listNotifications, readNotifications } from "@/lib/budget-requests/notifications";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) { const search = new URL(request.url).searchParams; return requestResponse(async () => listNotifications(await requestContext((await params).id), { unreadOnly: search.get("unread") === "1", cursor: search.get("cursor") ?? undefined })); }
export async function PATCH(request: Request, { params }: Context) { return requestResponse(async () => readNotifications(await requestContext((await params).id), await request.json())); }