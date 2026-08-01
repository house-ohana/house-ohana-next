"use client";

import { useState, useSyncExternalStore } from "react";
import Notice from "./Notice";

type Props = {
  resultPath: string;
};

// 共有時のtitle/textは診断内容を含まない一般的な文言のみ。回答の要約は生成しない。
const SHARE_TITLE = "House OHANA｜3分整理ナビの整理結果";
const SHARE_TEXT = "House OHANAの3分整理ナビで、退院後の暮らしと家族が確認することを整理しました。";

// navigator.shareの有無はブラウザ（外部システム）の状態のため、
// useSyncExternalStoreでサーバー描画時はfalse、クライアントでは実際の対応状況を読み取る。
function subscribe() {
  return () => {};
}
function getCanShareSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
function getCanShareServerSnapshot() {
  return false;
}

export default function DiagnosisShareActions({ resultPath }: Props) {
  const canUseWebShare = useSyncExternalStore(subscribe, getCanShareSnapshot, getCanShareServerSnapshot);
  const [message, setMessage] = useState("");

  const resultUrl = () => `${window.location.origin}${resultPath}`;

  const handleShare = async () => {
    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: resultUrl() });
    } catch {
      // ユーザーが共有をキャンセルした場合などは何もしない
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultUrl());
      setMessage("リンクをコピーしました。");
    } catch {
      setMessage("コピーに失敗しました。お手数ですが、アドレスバーのURLを手動でコピーしてください。");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {canUseWebShare ? (
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
          >
            この結果を共有する
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
          >
            結果のURLをコピーする
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
        >
          結果を印刷する
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
