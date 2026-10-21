"use client";

import Form from "next/form";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <Form action="/search" role="search" className="relative flex items-center">
      <label htmlFor="header-search" className="sr-only">
        Search poems
      </label>

      <input
        ref={inputRef}
        id="header-search"
        name="q"
        type="search"
        required
        placeholder="Search poems…"
        tabIndex={open ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.value) setOpen(false);
        }}
        className={cn(
          "glass-pill focus-ring h-10 rounded-full text-sm text-[var(--ink)]",
          "placeholder:text-[var(--ink-muted)] outline-none",
          "transition-all duration-300 ease-out",
          open
            ? "w-44 pl-4 pr-11 opacity-100 sm:w-60"
            : "pointer-events-none w-10 opacity-0",
        )}
      />

      <button
        type={open ? "submit" : "button"}
        onClick={() => {
          if (!open) setOpen(true);
        }}
        aria-label={open ? "Search" : "Open search"}
        aria-expanded={open}
        className={cn(
          "focus-ring absolute right-0 grid size-10 place-items-center rounded-full",
          "text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]",
          !open && "glass-pill",
        )}
      >
        <SearchIcon className="size-[18px]" />
      </button>
    </Form>
  );
}