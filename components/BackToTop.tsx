import { ArrowUpIcon } from "./icons";

export default function BackToTop() {
  return (
    <a
      href="#top"
      className="inline-flex items-center gap-2 text-sm font-semibold text-ohana-ink underline-offset-4 hover:underline"
    >
      <ArrowUpIcon width={18} height={18} />
      ページの先頭へ戻る
    </a>
  );
}
