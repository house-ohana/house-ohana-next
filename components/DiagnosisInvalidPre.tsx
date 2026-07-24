import Link from "next/link";
import type { PreDecodeResult } from "@/lib/diagnosis/pre/schema";
import Notice from "./Notice";

type Props = {
  reason: Extract<PreDecodeResult, { ok: false }>["reason"];
};

const MESSAGE_BY_REASON: Record<Props["reason"], string> = {
  missing_version:
    "このページには、3分整理ナビの結果を示す情報が含まれていません。お手数ですが、もう一度整理をお試しください。",
  unsupported_version:
    "このリンクは、現在の3分整理ナビのバージョンに対応していません。お手数ですが、もう一度整理をお試しください。",
  missing_who:
    "このリンクの内容を正しく読み取れませんでした。お手数ですが、もう一度整理をお試しください。",
  incomplete:
    "このリンクの内容を正しく読み取れませんでした。URLの一部が欠けているか、変更されている可能性があります。お手数ですが、もう一度整理をお試しください。",
};

export default function DiagnosisInvalidPre({ reason }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12 sm:px-8">
      <Notice title="結果を表示できませんでした" tone="caution">
        {MESSAGE_BY_REASON[reason]}
      </Notice>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/diagnosis?m=pre"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark"
        >
          3分整理ナビをはじめる
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-base font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
        >
          House OHANAのトップへ戻る
        </Link>
      </div>
    </section>
  );
}
