import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  // スマホの初期表示で本文を上部に見せたい画面（結果画面など）向けに、上下の余白を詰める
  compact?: boolean;
};

export default function PageHero({ eyebrow, title, description, compact = false }: Props) {
  return (
    <section className="border-b border-ohana-beige-dark bg-ohana-beige">
      <div
        className={`mx-auto flex max-w-4xl flex-col gap-2 px-5 sm:px-8 ${
          compact ? "py-6 sm:py-7" : "gap-4 py-14 sm:py-16"
        }`}
      >
        {eyebrow ? (
          <p className="text-sm font-semibold tracking-wide text-ohana-brown">{eyebrow}</p>
        ) : null}
        <h1 className={`font-bold leading-snug text-ohana-ink ${compact ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"}`}>
          {title}
        </h1>
        {description ? (
          <div className="max-w-2xl text-base leading-loose text-ohana-gray sm:text-lg">
            {description}
          </div>
        ) : null}
      </div>
    </section>
  );
}
