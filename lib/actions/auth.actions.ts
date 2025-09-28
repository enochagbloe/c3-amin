"use server";
import Account from "@/database/account.model";
import mongoose from "mongoose";
import User from "@/database/user.model";
import bcrypt from "bcrypt";
import { signIn } from "@/auth";
import action from "../handler/action";
import handleError from "../handler/error";
import { NotFoundError } from "../http.error";
import { SignInSchema, SignUpSchema } from "../validations";


export async function signUpWithCredentials(
  params: AuthCredentials
): Promise<ActionResponse> {
  //validation
  const validationResult = await action({
    params,
    schema: SignUpSchema,
  });

  if (!validationResult || validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { name, username, email, password, image } = validationResult.params!;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existingUser = await User.findOne({ email }).session(session).lean();
    if (existingUser) {
      throw new Error("Email is already registered");
    }
    const existingUsername = await User.findOne({ username })
      .session(session)
      .lean();

    if (existingUsername) {
      throw new Error("Username is already taken");
    }
    //hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user document with array syntax for consistency
    const [newUser] = await User.create(
      [
        {
          name,
          username,
          email,
          password: hashedPassword,
          image,
        },
      ],
      { session }
    );
    if (!newUser) {
      throw new Error("Failed to create user");
    }

    // Create associated account
    const [newAccount] = await Account.create(
      [
        {
          userId: newUser._id,
          name,
          email,
          username,
          password: hashedPassword,
          provider: "credentials",
          providerAccountId: email,
        },
      ],
      { session }
    );
    console.log(newAccount);
    if (!newAccount) {
      throw new Error("Failed to create account");
    }

    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function signInWithCredentials(
  params: Pick<AuthCredentials, "email" | "password">
): Promise<ActionResponse> {
  // set validations
  const validationResult = await action({
    params,
    schema: SignInSchema,
  });

  if (!validationResult || validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { email, password } = validationResult.params!;
  try {
    //lets find the user by email and password
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new NotFoundError("User do not exist");
    }
    // check existing account
    const existingAccount = await Account.findOne({
      provider: "credentials",
      providerAccountId: email,
    });
    if (!existingAccount) {
      throw new NotFoundError("Account do not exist");
    }
    // check password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingAccount.password
    );
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Sign in using NextAuth's signIn function
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result.error) {
      throw new Error("Invalid credentials");
    }

    return { success: true };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
