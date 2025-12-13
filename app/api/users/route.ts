import User from "@/database/user.model";
import handleError from "@/lib/handler/error";
import { ValidationError } from "@/lib/http.error";
import dbConnect from "@/lib/mongoose";
import {  UserSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
export async function GET() {
  try {
    const users = await User.find().lean();
    
    // Map the data to include 'id' field
    const formattedUsers = users.map(user => ({
      id: user._id?.toString(), // Convert MongoDB _id to string id
      staffId: user.staffId,
      name: user.name,
      email: user.email,
      status: user.status,
      date: user.createdAt || user.date, // Adjust based on your schema
      userId: user.userId || user._id?.toString(),
      role: user.role
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// create a new user
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const validateData = UserSchema.safeParse(body);
    if (!validateData.success) {
      throw new ValidationError(validateData.error.flatten().fieldErrors);
    }

    const { email, username } = validateData.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError({ email: ["email already in use."] });
    }

    const existingUsername = await User .findOne({ username });
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
