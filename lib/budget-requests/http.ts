import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RequestError } from "@/lib/http.error";
import { Prisma } from "@/lib/generated/prisma";

export async function requestResponse(
  run: () => Promise<unknown>,
  status = 200,
) {
  try {
    return NextResponse.json(
      { success: true, data: await run() },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "This request changed while you were reviewing it. Refresh and try again.",
          },
        },
        { status: 409 },
      );
    }
    const message =
      error instanceof ZodError
        ? error.issues.map((issue) => issue.message).join(". ")
        : error instanceof RequestError
          ? error.message
          : error instanceof SyntaxError
            ? "Invalid JSON body"
            : "Unable to process this request";
    const code =
      error instanceof ZodError || error instanceof SyntaxError
        ? 400
        : error instanceof RequestError
          ? error.statusCode
          : 500;
    if (code === 500) console.error("Budget request operation failed", error);
    return NextResponse.json(
      { success: false, error: { message } },
      { status: code, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
