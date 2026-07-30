import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
};

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  md: "px-7 py-3 text-base",
  lg: "px-9 py-4 text-lg shadow-sm",
};

export default function PrimaryButton({ href, children, className = "", size = "md" }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ohana-green font-semibold text-ohana-white transition-colors hover:bg-ohana-green-dark focus-visible:outline-offset-4 ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
