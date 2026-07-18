export type NavItem = {
  label: string;
  href: string;
};

// ヘッダーの主要ナビゲーション
export const mainNav: NavItem[] = [
  { label: "トップ", href: "/" },
  { label: "ご家族の方へ", href: "/family" },
  { label: "状況を整理する", href: "/diagnosis" },
  { label: "専門職等の方へ", href: "/professionals" },
  { label: "House OHANAについて", href: "/about" },
  { label: "運営方針", href: "/policy" },
  { label: "お問い合わせ", href: "/contact" },
];

// フッターの補足ナビゲーション
export const footerNav: NavItem[] = [
  { label: "トップ", href: "/" },
  { label: "ご家族の方へ", href: "/family" },
  { label: "状況を整理する", href: "/diagnosis" },
  { label: "専門職等の方へ", href: "/professionals" },
  { label: "House OHANAについて", href: "/about" },
  { label: "運営方針", href: "/policy" },
  { label: "調査・研究に関する方針", href: "/research" },
  { label: "お問い合わせ", href: "/contact" },
  { label: "プライバシーポリシー", href: "/privacy" },
  { label: "免責事項", href: "/disclaimer" },
];
