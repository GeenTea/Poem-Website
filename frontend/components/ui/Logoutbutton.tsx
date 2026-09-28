'use clien'

import { useRouter } from "next/router";

export function LogoutButton(){
    const router = useRouter()

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: 'POST'})
        router.replace("/")
        router.reload()
    }

    return(
        <button onClick={handleLogout}>Logout</button>
    )
}