import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request){
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value

    if(!token) return null

    const body = await request.json()
    const response = await fetch(`${process.env.API_URL}/auth/logout`, {
        method: 'POST',
        headers:{
            Authorization: `Bearer ${token}`
        }
    })
}