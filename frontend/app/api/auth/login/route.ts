import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json()
    const response = await fetch(`http://localhost:3001/auth/login`, {
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:JSON.stringify(body)
    })

    const data = await response.json()

    if(!response.ok){
        return NextResponse.json(data, { status: response.status})
    }

    const cookiesStore = await cookies()

    cookiesStore.set("accessToken", data.accessToken, {
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
        sameSite:"lax",
        path:"/",
        maxAge: 60 * 60
    })
    cookiesStore.set("refreshToken", data.refreshToken,{
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
        sameSite:"lax",
        path:"/",
        maxAge: 60 * 60 * 24 * 30
    })

    return NextResponse.json({ok:true})
}