import { requestResponse } from "@/lib/budget-requests/http";
import { personalProfile, updatePersonalProfile } from "@/lib/profile";
export async function GET() {
  return requestResponse(personalProfile);
}
export async function PATCH(request: Request) {
  return requestResponse(async () =>
    updatePersonalProfile(await request.json()),
  );
}
