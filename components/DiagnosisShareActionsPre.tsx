"use client";

import { useState, useSyncExternalStore } from "react";
import Notice from "./Notice";

type Props = {
  resultPath: string;
  shareAudienceLabel: string;
};

// 共有時のtitle/textは診断内容を含まない一般的な文言のみ。回答の要約は生成しない。
const SHARE_TITLE = "House OHANA｜3分整理ナビの整理結果";
const SHARE_TEXT = "3分整理ナビの整理結果です。";

function subscribe() {
  return () => {};
}
function getCanShareSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
function getCanShareServerSnapshot() {
  return false;
}

export default function DiagnosisShareActionsPre({ resultPath, shareAudienceLabel }: Props) {
  const canUseWebShare = useSyncExternalStore(subscribe, getCanShareSnapshot, getCanShareServerSnapshot);
  const [message, setMessage] = useState("");

  const resultUrl = () => `${window.location.origin}${resultPath}`;

  const handleShare = async () => {
    try {
      if (canUseWebShare) {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: resultUrl() });
        return;
      }
      await navigator.clipboard.writeText(resultUrl());
      setMessage("リンクをコピーしました。共有する相手にお渡しください。");
    } catch {
      // ユーザーが共有をキャンセルした場合などは何もしない
    }
  };

  const handleSave = async () => {
    try {
      await navigator.clipboard.writeText(resultUrl());
      setMessage("リンクをコピーしました。保存しておくと、後から同じ結果を確認できます。");
    } catch {
      setMessage("コピーに失敗しました。お手数ですが、アドレスバーのURLを手動でコピーしてください。");
    }
  };

  return (
    <div className="no-print flex flex-col gap-4">
      <Notice tone="caution">
        共有用URLには、今回選んだ回答から作成された結果が含まれます。共有する相手をご確認ください。
      </Notice>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-sm font-semibold text-ohana-white hover:bg-ohana-green-dark"
          >
            結果を共有する
          </button>
          <p className="text-sm text-ohana-gray">共有先の目安：{shareAudienceLabel}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
        >
          保存する
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
        >
          印刷する
        </button>
      </div>

      <p aria-live="polite" className="min-h-6 text-sm text-ohana-green-dark">
        {message}
      </p>

      <Notice tone="caution">
        このリンクを知っている人は、同じ整理結果を閲覧できます。個人情報や詳しい医療情報は入力しないでください。
      </Notice>
    </div>
  );
}
