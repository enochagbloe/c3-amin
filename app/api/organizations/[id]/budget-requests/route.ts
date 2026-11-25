import { requestContext } from "@/lib/budget-requests/access";
import { createRequest, listRequests } from "@/lib/budget-requests/service";
import { requestResponse } from "@/lib/budget-requests/http";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  return requestResponse(async () => {
    const { id } = await params;
    const search = new URL(request.url).searchParams;
    return listRequests(await requestContext(id), {
      scope: search.get("scope") ?? undefined,
      page: search.get("page") ?? undefined,
    });
  });
}
export async function POST(request: Request, { params }: Context) {
  return requestResponse(async () => {
    const { id } = await params;
    return createRequest(await requestContext(id), await request.json());
  }, 201);
}
