import User from "@/database/user.model";
import handleError from "@/lib/handler/error";
import { ValidationError } from "@/lib/http.error";
import dbConnect from "@/lib/mongoose";
import { SignInSchema, UserSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    const user = await User.find();

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

// create a new user
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = request.json();

    const validateData = UserSchema.safeParse(body);
    if (!validateData.success) {
      throw new ValidationError(validateData.error.flatten().fieldErrors);
    }

    const { email, username } = validateData.data;

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new ValidationError({ email: ["email already in use."] });
    }

    const existingUsername = await User.findOne({ username });
    if (!existingUsername) {
      throw new ValidationError({ username: ["Username already in use"] });
    }

    //create new use
    const user = await User.create(validateData.data);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
