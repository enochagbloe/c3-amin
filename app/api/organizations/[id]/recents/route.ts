import { requestContext } from "@/lib/budget-requests/access";
import { requestResponse } from "@/lib/budget-requests/http";
import { workspaceRecents } from "@/lib/organizations/recents";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) { return requestResponse(async () => workspaceRecents(await requestContext((await params).id))); }
export async function POST(request: Request, { params }: Context) { return requestResponse(async () => workspaceRecents(await requestContext((await params).id), await request.json())); }
