import Link from "next/link";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <div
      className={cn(
        "rounded-[1.56rem] border border-leaf bg-sand",
        "shadow-[0_0.25rem_0.25rem_rgba(0,0,0,0.25)] backdrop-blur-[2px]",
        "relative flex w-full flex-col",
        "px-6 pt-6 pb-5 mb-10 transition-shadow hover:shadow-[0_0.5rem_1.25rem_rgba(90,72,40,0.18)]",
      )}
    >
      <h1 className="mt-5 max-w-2xl font-serif text-4xl leading-[1.1] sm:text-6xl georgia">
        Somewhere quiet to keep the lines that keep you up.
      </h1>

      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
        Poem Nest is a home for original poetry — publish drafts, read new voices, and talk about the exact line that landed.
      </p>

      <Link
        href="/poems/new"
        className={cn(
          "self-start relative z-10 mt-5 inline-flex h-9 min-w-[6.06rem] items-center justify-center px-3",
          "border border-leaf bg-cream rounded-4xl text-xs text-leaf-deep backdrop-blur-[2px]",
          "transition-colors hover:bg-leaf/15 focus-ring",
        )}
      >
        Start a poem
      </Link>
    </div>
  );
}