import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  className?: string;
};

export default function FeatureCard({ icon, title, description, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-6 ${className}`}
    >
      {icon ? <div className="text-ohana-green">{icon}</div> : null}
      <h3 className="text-lg font-bold text-ohana-ink">{title}</h3>
      {description ? (
        <div className="text-base leading-loose text-ohana-gray">{description}</div>
      ) : null}
    </div>
  );
}
