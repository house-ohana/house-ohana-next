import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function SecondaryButton({ href, children, className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ohana-green px-7 py-3 text-base font-semibold text-ohana-green-dark transition-colors hover:bg-ohana-green-light ${className}`}
    >
      {children}
    </Link>
  );
}
