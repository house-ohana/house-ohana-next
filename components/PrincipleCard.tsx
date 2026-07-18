import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description: ReactNode;
};

export default function PrincipleCard({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-ohana-green-light p-7">
      {icon ? <div className="text-ohana-green-dark">{icon}</div> : null}
      <h3 className="text-xl font-bold text-ohana-ink">{title}</h3>
      <p className="text-base leading-loose text-ohana-ink/80">{description}</p>
    </div>
  );
}
