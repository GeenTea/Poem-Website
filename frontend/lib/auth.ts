import { cookies } from "next/headers";
import type { User } from "@/types/user";

/** accessToken из httpOnly-cookie (только на сервере) */
export async function getAccessToken() {
    return (await cookies()).get("accessToken")?.value ?? null
}

export async function getCurrentUser(): Promise<User | null>{
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value

    if(!token) return null

    try{
        const response = await fetch(`${process.env.API_URL}/auth/me`, {
            method: "GET",
            headers:{
                Authorization: `Bearer ${token}`
            },
            cache:"no-store",
        })

        if (!response.ok) return null

        return await response.json()
    }catch(error){
        console.error(error)
        return null
    }
}