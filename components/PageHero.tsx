import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
};

export default function PageHero({ eyebrow, title, description }: Props) {
  return (
    <section className="border-b border-ohana-beige-dark bg-ohana-beige">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-14 sm:px-8 sm:py-16">
        {eyebrow ? (
          <p className="text-sm font-semibold tracking-wide text-ohana-brown">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-bold leading-snug text-ohana-ink sm:text-4xl">{title}</h1>
        {description ? (
          <div className="max-w-2xl text-base leading-loose text-ohana-gray sm:text-lg">
            {description}
          </div>
        ) : null}
      </div>
    </section>
  );
}
