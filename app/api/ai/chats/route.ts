import handleError from "@/lib/handler/error";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message) throw new Error("Message is required");
    const reply = `You said: "${message}". That’s interesting!`;
    return NextResponse.json(
      {
        success: true,
        data: reply,
      },
      { status: 200 }
    );
  } catch (error) {
    handleError(error, "api") as APIErrorResponse;
  }
}
