import { cookies } from "next/headers";

export async function getCurrentUser(){
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