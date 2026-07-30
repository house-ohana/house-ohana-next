"use client";

import { useEffect } from "react";

// 結果画面の表示時に、必ずページ最上部から見えるようにする。
// Next.jsのルーター遷移時のスクロール位置に依存せず、明示的に保証する。
export default function ScrollToTopOnMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return null;
}
