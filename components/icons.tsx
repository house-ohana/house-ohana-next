import type { SVGProps } from "react";

/**
 * House OHANA で使用するシンプルな線画アイコン集。
 * 外部アイコンライブラリを使わず、すべて自作のインラインSVGで統一しています。
 * 装飾目的のため既定で aria-hidden。意味を持たせる場合は呼び出し側で role/aria-label を付与してください。
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 32,
  height: 32,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HouseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 15.5 16 6l11 9.5" />
      <path d="M8 13.5V26h16V13.5" />
      <path d="M13 26v-7h6v7" />
    </svg>
  );
}

export function FamilyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="10" r="3.2" />
      <circle cx="21" cy="10" r="3.2" />
      <path d="M5 25c0-4 2.7-6.5 6-6.5s6 2.5 6 6.5" />
      <path d="M15 25c0-4 2.7-6.5 6-6.5s6 2.5 6 6.5" />
    </svg>
  );
}

export function RoadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5 6 27" />
      <path d="M20 5l6 22" />
      <path d="M16 9v2.5M16 15v2.5M16 21v2.5" />
    </svg>
  );
}

export function ChairIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 5v13" />
      <path d="M23 5v13" />
      <path d="M9 12h14" />
      <path d="M9 18v9" />
      <path d="M23 18v9" />
      <path d="M9 22h14" />
    </svg>
  );
}

export function TreeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 6c-4 0-7 3-7 6.5 0 2 1 3.6 2.6 4.6C10.2 18 9 19.7 9 21.7 9 24.6 12 27 16 27s7-2.4 7-5.3c0-2-1.2-3.7-2.6-4.6C22 16.1 23 14.5 23 12.5 23 9 20 6 16 6Z" />
      <path d="M16 27v-6" />
    </svg>
  );
}

export function ConversationIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9h14a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H14l-5 4v-4H9a3 3 0 0 1-3-3v-8Z" />
      <path d="M23 12h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2v3l-3.5-3" />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 4h9l5 5v19H10Z" />
      <path d="M19 4v5h5" />
      <path d="M13 17h9M13 21h9M13 13h4" />
    </svg>
  );
}

export function ChoiceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="10" r="3.4" />
      <circle cx="23" cy="10" r="3.4" />
      <circle cx="16" cy="23" r="3.4" />
      <path d="M11 12.5 14.5 20.5" />
      <path d="M21 12.5 17.5 20.5" />
    </svg>
  );
}

export function RegionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 27s9-8.6 9-15a9 9 0 1 0-18 0c0 6.4 9 15 9 15Z" />
      <circle cx="16" cy="12" r="3.2" />
    </svg>
  );
}

export function HandsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 17l5-4 6 2 7-3" />
      <path d="M22 12l4-2" />
      <path d="M9 15l4 8" />
      <path d="M15 15.5 18.5 23a2 2 0 0 0 3.6-1.8L18 12.5" />
      <path d="M4 17l3 6.5a2 2 0 0 0 3.6-1.7L9 17" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9h22M5 16h22M5 23h22" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 8l16 16M24 8 8 24" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 17l7 7 13-15" />
    </svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 25V8" />
      <path d="M8 15l8-8 8 8" />
    </svg>
  );
}
