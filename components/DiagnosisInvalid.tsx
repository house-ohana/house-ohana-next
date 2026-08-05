import Link from "next/link";
import type { PostDecodeFailureReason } from "@/lib/diagnosis/post/schema";
import Notice from "./Notice";

type Props = {
  reason: PostDecodeFailureReason;
};

const MESSAGE_BY_REASON: Record<PostDecodeFailureReason, string> = {
  missing_version:
    "このページには、3分整理ナビの結果を示す情報が含まれていません。お手数ですが、もう一度整理をお試しください。",
  unsupported_version:
    "保存された回答形式が更新されています。お手数ですが、最初からもう一度整理してください。",
  incomplete:
    "このリンクの内容を正しく読み取れませんでした。URLの一部が欠けているか、変更されている可能性があります。お手数ですが、もう一度整理をお試しください。",
  stage_mismatch:
    "保存された回答形式が更新されています。お手数ですが、最初からもう一度整理してください。",
  future_not_supported:
    "この結果は、今すぐの対応より、これからの備えを整理する入り口に合っています。お手数ですが、下のボタンからやり直してください。",
  invalid_mode:
    "このURLの形式を認識できませんでした。お手数ですが、もう一度整理をお試しください。",
};

export default function DiagnosisInvalid({ reason }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12 sm:px-8">
      <Notice title="結果を表示できませんでした" tone="caution">
        {MESSAGE_BY_REASON[reason]}
      </Notice>
      <div className="flex flex-wrap gap-3">
        {reason === "future_not_supported" ? (
          <Link
            href="/diagnosis?m=pre"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark"
          >
            これからの備えを整理する
          </Link>
        ) : (
          <Link
            href="/diagnosis?m=post"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark"
          >
            3分整理ナビをはじめる
          </Link>
        )}
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
