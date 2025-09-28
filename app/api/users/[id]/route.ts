

import User from "@/database/user.model";
import handleError from "@/lib/handler/error";
import { NotFoundError } from "@/lib/http.error";
import dbConnect from "@/lib/mongoose";
import { UserSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

// Get the user
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return new Response(JSON.stringify({ error: "User ID is required" }), {
      status: 400,
    });
  }

  try {
    await dbConnect();
    // Fetch user data from the database using the id
    const user = await User.findById(id)
    if (!user) throw new NotFoundError("User not found");
    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return handleError(error, "api") as APIErrorResponse;
    }
  }
}


//Delete the user
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if(!id) throw new NotFoundError('User ID is required');

    try {
        await dbConnect();
        const user = await User.findByIdAndDelete(id);
        if (!user) throw new NotFoundError("User not found");
        return NextResponse.json({ success: true, message: "User deleted successfully" }, { status: 200 });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return handleError(error, "api") as APIErrorResponse;
        }
    }
}

//Update the user
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if(!id) throw new NotFoundError('User ID is required');

    try {
        await dbConnect();
        const body = await req.json();

        const validatedData = UserSchema.partial().parse(body);

        // Update user data in the database using the id
        const user = await User.findByIdAndUpdate(id, validatedData, { new: true });
        if (!user) throw new NotFoundError("User not found");
        return NextResponse.json({ success: true, message: "User updated successfully" }, { status: 200 });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return handleError(error, "api") as APIErrorResponse;
        }
    }
}
