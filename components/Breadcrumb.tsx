import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Crumb[];
};

export default function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="パンくずリスト" className="mx-auto w-full max-w-4xl px-5 pt-6 sm:px-8">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-ohana-gray">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="underline-offset-2 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ohana-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
