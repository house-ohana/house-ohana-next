import Link from "next/link";
import { footerNav } from "@/lib/navigation";
import { siteConfig } from "@/lib/site-config";
import BackToTop from "./BackToTop";

export default function Footer() {
  const { operator } = siteConfig;
  const hasOperatorLine = operator.legalName || operator.representativeName;

  return (
    <footer className="border-t border-ohana-beige-dark bg-ohana-beige">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-3">
          <p className="text-lg font-bold text-ohana-ink">{siteConfig.name}</p>
          <p className="max-w-xl text-base leading-loose text-ohana-ink/85">
            {siteConfig.tagline}
            <br />
            {siteConfig.subTagline}
          </p>
        </div>

        <nav aria-label="フッターナビゲーション">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block min-h-11 py-2 text-sm text-ohana-ink underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rounded-xl border border-ohana-beige-dark bg-ohana-ivory p-4 text-sm leading-loose text-ohana-ink/85">
          House
          OHANAは、緊急の医療相談や救急対応を行う窓口ではありません。生命や身体に緊急性がある場合は、医療機関や公的な緊急窓口へご連絡ください。
        </div>

        <div className="flex flex-col gap-2 border-t border-ohana-beige-dark pt-6 text-sm text-ohana-gray sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            {hasOperatorLine ? (
              <p>
                {operator.legalName}
                {operator.legalName && operator.representativeName ? "　" : ""}
                {operator.representativeName}
              </p>
            ) : null}
            <p>
              &copy; {siteConfig.copyrightYear} {siteConfig.name}
            </p>
          </div>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
