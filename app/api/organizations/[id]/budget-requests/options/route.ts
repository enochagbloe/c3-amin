import { requestContext } from "@/lib/budget-requests/access";
import { requestOptions } from "@/lib/budget-requests/approval-settings";
import { requestResponse } from "@/lib/budget-requests/http";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return requestResponse(async () =>
    requestOptions(await requestContext((await params).id)),
  );
}
