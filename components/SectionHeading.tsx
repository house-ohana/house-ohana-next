import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h2" | "h3";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as = "h2",
}: Props) {
  const Heading = as;
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-wide text-ohana-brown">{eyebrow}</p>
      ) : null}
      <Heading className="text-2xl font-bold leading-snug text-ohana-ink sm:text-3xl">
        {title}
      </Heading>
      {description ? (
        <div className="max-w-2xl text-base leading-loose text-ohana-gray sm:text-lg">
          {description}
        </div>
      ) : null}
    </div>
  );
}
