'use client'

import { useRouter } from "next/navigation";

export function LogoutButton({className}: {className?: string}){
    const router = useRouter()

    async function handleLogout(){ 
        await fetch("/api/auth/logout", { method: 'POST'})
        router.replace("/")
        router.refresh()
    }

    return(
        <button onClick={handleLogout} className={className}>
            Logout
        </button>
    )
}