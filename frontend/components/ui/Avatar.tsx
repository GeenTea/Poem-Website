import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

const sizes = {
  sm: { box: "size-7 text-xs", px: 28 },
  md: { box: "size-9 text-sm", px: 36 },
  lg: { box: "size-14 text-lg", px: 56 },
};

interface AvatarProps {
  name: string;
  src: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const { box, px } = sizes[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={cn(box, "shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        box,
        "flex shrink-0 items-center justify-center rounded-full bg-[#D9D9D9] font-medium text-ink",
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}