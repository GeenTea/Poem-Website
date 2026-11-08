import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request){
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value

    if(!token) return NextResponse.json({ok:true})

    try {
        await fetch(`${process.env.API_URL}/auth/logout`, {
            method: 'POST',
            headers:{
                Authorization: `Bearer ${token}`
            }
        })
    }catch(error){
        console.error(error)
    }

    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")

    return NextResponse.json({ok:true}) 
}