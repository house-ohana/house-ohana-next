import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function PrimaryButton({ href, children, className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ohana-green px-7 py-3 text-base font-semibold text-ohana-white transition-colors hover:bg-ohana-green-dark focus-visible:outline-offset-4 ${className}`}
    >
      {children}
    </Link>
  );
}
