import { requestContext } from "@/lib/budget-requests/access";
import { requestResponse } from "@/lib/budget-requests/http";
import { budgetSummary } from "@/lib/budget-requests/summary";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return requestResponse(async () => budgetSummary(await requestContext((await params).id))); }
