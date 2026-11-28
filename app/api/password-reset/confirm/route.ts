import { requestResponse } from "@/lib/budget-requests/http";
import { confirmPasswordReset } from "@/lib/password-reset/service";
export async function POST(request: Request) { return requestResponse(async () => confirmPasswordReset(await request.json())); }
