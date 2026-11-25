import { requestContext } from "@/lib/budget-requests/access";
import {
  requestOptions,
  updateApprovalSettings,
} from "@/lib/budget-requests/approval-settings";
import { requestResponse } from "@/lib/budget-requests/http";

type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  return requestResponse(async () =>
    requestOptions(await requestContext((await params).id)),
  );
}
export async function PUT(request: Request, { params }: Context) {
  return requestResponse(async () =>
    updateApprovalSettings(
      await requestContext((await params).id),
      await request.json(),
    ),
  );
}
