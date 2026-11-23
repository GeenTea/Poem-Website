'use client'

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
    className?: string;
    /** Содержимое кнопки (например, иконка + текст). По умолчанию — «Logout» */
    children?: ReactNode;
};

export function LogoutButton({ className, children = "Logout" }: Props){
    const router = useRouter()

    async function handleLogout(){
        await fetch("/api/auth/logout", { method: 'POST'})
        router.replace("/")
        router.refresh()
    }

    return(
        <button type="button" onClick={handleLogout} className={className}>
            {children}
        </button>
    )
}
