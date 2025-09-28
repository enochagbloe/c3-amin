import Account from "@/database/account.model";
import handleError from "@/lib/handler/error";
import { NotFoundError } from "@/lib/http.error";
import dbConnect from "@/lib/mongoose";
import { NextResponse } from "next/server";


//Get
export async function GET(_: Request, {params}:{params: Promise<{id: string }>}){

    const { id } = await params;
    if(!id) throw new NotFoundError("Account")
    
    try {
        await dbConnect()
        const account = await Account.findById(id)
        if(!account ) throw new NotFoundError("Account")

        return NextResponse.json({success:true, data:account}, {status: 200})
    } catch (error) {
       return handleError(error, "api") as APIErrorResponse
    }
}