import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Выход: закрываем сессию на бэкенде и чистим cookie.
// Если accessToken истёк, proxy.ts уже обновил его по refreshToken до этого обработчика,
// так что сессия на бэкенде тоже будет закрыта. Cookie чистим в любом случае.
export async function POST(){
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value

    if(token){
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
    }

    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")

    return NextResponse.json({ok:true})
}
