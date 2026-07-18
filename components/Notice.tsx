import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  tone?: "neutral" | "caution";
};

export default function Notice({ title, children, tone = "neutral" }: Props) {
  const toneClass =
    tone === "caution"
      ? "border-ohana-brown bg-ohana-brown-light"
      : "border-ohana-beige-dark bg-ohana-beige";

  return (
    <div className={`rounded-xl border p-5 ${toneClass}`} role="note">
      {title ? <p className="mb-2 text-base font-bold text-ohana-ink">{title}</p> : null}
      <div className="text-sm leading-loose text-ohana-ink/85 sm:text-base">{children}</div>
    </div>
  );
}
