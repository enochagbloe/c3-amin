"use server";
import { neon } from "@neondatabase/serverless";

export async function getData() {
    const sql = neon(process.env.DATABSE_URL as string);
    const data = await sql`... `;
    return data
}
