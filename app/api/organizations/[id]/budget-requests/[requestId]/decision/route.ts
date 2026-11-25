import { requestContext } from "@/lib/budget-requests/access";
import { decideRequest } from "@/lib/budget-requests/service";
import { requestResponse } from "@/lib/budget-requests/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  return requestResponse(async () => {
    const { id, requestId } = await params;
    return decideRequest(
      await requestContext(id),
      requestId,
      await request.json(),
    );
  });
}
