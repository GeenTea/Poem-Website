import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "article" | "section";
};

export function GlassCard({ as: Tag = "div", className, ...props }: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-[1.56rem] border border-leaf bg-sand",
        "shadow-[0_0.25rem_0.25rem_rgba(0,0,0,0.25)] backdrop-blur-[2px]",
        className,
      )}
      {...props}
    />
  );
}