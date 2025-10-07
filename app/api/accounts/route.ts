// we have to get all the list of account

import Account from "@/database/account.model";
import handleError from "@/lib/handler/error";
import { ForbiddenError } from "@/lib/http.error";
import dbConnect from "@/lib/mongoose";
import { SignUpSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const accounts = await Account.find();
    return NextResponse.json(
      {
        success: true,
        data: accounts,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

// lets have an Api that creates a new account

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const validateData = SignUpSchema.safeParse(body);

    //check for an existing Account
    const existingAccount = await Account.findOne({
      provider: validateData.data?.email,
    });

    if (existingAccount)
      throw new ForbiddenError("Account with the same email already exist");

    // create new account
    const newAccount = await Account.create(validateData);
    return NextResponse.json(
      { success: true, data: newAccount },
      { status: 201 }
    );
  } catch (error) {
    handleError(error, "api") as APIErrorResponse;
  }
}
