"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNav } from "@/lib/navigation";
import { siteConfig } from "@/lib/site-config";
import { CloseIcon, MenuIcon } from "./icons";

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-ohana-beige-dark bg-ohana-ivory/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-lg font-bold tracking-wide text-ohana-ink"
        >
          {siteConfig.operator.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={siteConfig.operator.logoPath}
              alt={siteConfig.name}
              className="h-8 w-auto"
            />
          ) : null}
          <span>{siteConfig.name}</span>
        </Link>

        <nav aria-label="メインナビゲーション" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`inline-block rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? "bg-ohana-green-light text-ohana-green-dark"
                      : "text-ohana-ink hover:bg-ohana-beige"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ohana-ink lg:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div
        id="mobile-navigation"
        hidden={!isOpen}
        className="border-t border-ohana-beige-dark bg-ohana-ivory lg:hidden"
      >
        <nav aria-label="モバイルナビゲーション">
          <ul className="flex flex-col px-5 py-2 sm:px-8">
            {mainNav.map((item) => (
              <li key={item.href} className="border-b border-ohana-beige last:border-0">
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block min-h-12 py-3 text-base font-semibold ${
                    isActive(item.href) ? "text-ohana-green-dark" : "text-ohana-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
