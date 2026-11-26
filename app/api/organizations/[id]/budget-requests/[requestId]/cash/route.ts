import { requestContext } from "@/lib/budget-requests/access";
import { requestResponse } from "@/lib/budget-requests/http";
import { recordCash } from "@/lib/budget-requests/cash";
export async function POST(request: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) { return requestResponse(async () => { const { id, requestId } = await params; return recordCash(await requestContext(id), requestId, await request.json()); }); }