/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use server"

import { getAllUsersSchema } from "../validations";
import action from "../handler/action";
import handleError from "../handler/error";
import prisma from "@/lib/prisma";

export async function getAllUsers(params: getAllUsers): Promise<ActionResponse<any>>{
    const validationResult = await action({
        params,
        schema: getAllUsersSchema,
        authorize: true,

    })
    if(validationResult instanceof Error) return handleError(validationResult) as ErrorResponse

    const { userId } = validationResult.params!
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        
        if(!user) throw new Error('User not found') 
        
        // Serialize the user data
        const serializedUser = {
            id: user.id,
            staffId: user.staffId,
            name: user.name,
            username: user.username,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            bio: user.bio || '',
            phone: user.phone || '',
            city: user.city || '',
            status: (user.status || 'active') as 'active' | 'inactive',
            role: user.role || 'member',
            image: user.image || '',
            location: user.location || '',
            portfolio: user.portfolio || '',
            reputation: user.reputation || 0,
        //  createdAt: user.createdAt?.toString() || '',
        //  updatedAt: user.updatedAt?.toString() || '',
        }
        
        return {
            success: true,
            data: serializedUser
        }
        
    } catch (error) {
        return handleError(error) as ErrorResponse
    }
}