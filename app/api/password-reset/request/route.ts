import { requestResponse } from "@/lib/budget-requests/http";
import { requestPasswordReset } from "@/lib/password-reset/service";
export async function POST(request: Request) { return requestResponse(async () => requestPasswordReset(await request.json())); }
