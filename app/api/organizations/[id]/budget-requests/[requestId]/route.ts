import { requestContext } from "@/lib/budget-requests/access";
import { getRequest } from "@/lib/budget-requests/service";
import { requestResponse } from "@/lib/budget-requests/http";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  return requestResponse(async () => {
    const { id, requestId } = await params;
    return getRequest(await requestContext(id), requestId);
  });
}
