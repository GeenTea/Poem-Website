"use client"

import { User } from "@/types/user"
import { useState } from "react"
import { LogoutButton } from "./Logoutbutton"
import Link from "next/link"

function getInitials(name: string) {
return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ user }: { user: User }){
    const [isOpen, setIsOpen] = useState(false) 

    


    return(
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className="focus-ring rounded-full"
            >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="size-9 rounded-full object-cover ring-1 ring-[var(--glass-border)]"
                  />
                ) : (
                  <span className="grid size-9 place-items-center rounded-full bg-[var(--avatar-bg)] text-xs font-medium text-[var(--ink)] ring-1 ring-[var(--glass-border)]">
                    {getInitials(user.displayName ?? user.username)}
                  </span>
                )}
            </button>


            {isOpen && <Panel />}
        </div>

    )
}

/* User Panel */

function Panel(){
  return (
    <div className="glass-panel absolute right-0 top-full mt-2 w-48 rounded-xl p-3 text-sm text-[var(--ink)] shadow-lg">
      <ul className="flex flex-col gap-2">
        <li>
          <Link
            href="/profile"
            className="focus-ring block rounded-md px-3 py-2 transition-colors hover:bg-[var(--glass-hover)]"
          >
            Profile
          </Link>
        </li>
        <li>
          <Link
            href="/settings"
            className="focus-ring block rounded-md px-3 py-2 transition-colors hover:bg-[var(--glass-hover)]"
          >
            Settings
          </Link>
        </li>
        <li className="mt-1 border-t border-[var(--glass-border)] pt-1">
          <LogoutButton className={"focus-ring block w-full rounded-md px-3 py-2 text-left text-[var(--accent)] transition-colors hover:bg-[var(--glass-hover)]"}
          />
        </li>
      </ul>
    </div>
  );
}