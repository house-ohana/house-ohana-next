"use client";

import { useState } from "react";
import Link from "next/link";
import type { PreResult, PreResultItem } from "@/lib/diagnosis/pre/types";
import Notice from "./Notice";
import DiagnosisShareActionsPre from "./DiagnosisShareActionsPre";

type Props = {
  result: PreResult;
  resultPath: string;
};

const WHO_INTRO: Record<PreResult["who"], string> = {
  self: "ご本人が、これからの暮らしについて整理した結果です。",
  family: "ご家族や身近な方が、ご本人のこれからについて整理した結果です。",
};

const PRINT_VISIBLE_A_LIMIT = 5;

function ResultCard({ item }: { item: PreResultItem }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-ohana-beige-dark bg-ohana-white p-4">
      <p className="text-base leading-loose text-ohana-ink sm:text-lg">{item.fact}</p>
      {item.point ? (
        <p className="text-sm leading-loose text-ohana-gray sm:text-base">話し合う論点：{item.point}</p>
      ) : null}
      {item.area ? (
        <p className="text-sm leading-loose text-ohana-brown sm:text-base">相談先の例：{item.area}</p>
      ) : null}
    </li>
  );
}

export default function DiagnosisResultSectionsPre({ result, resultPath }: Props) {
  const [showRest, setShowRest] = useState(false);
  const createdAt = new Date().toLocaleDateString("ja-JP");
  const consultAreas = Array.from(
    new Set(
      result.bTop3
        .flatMap((item) => (item.area ? item.area.split("／") : []))
        .map((area) => area.trim())
        .filter(Boolean),
    ),
  );

  return (
    <div className="flex flex-col gap-8">
      <p className="text-base leading-loose text-ohana-gray sm:text-lg">{WHO_INTRO[result.who]}</p>

      {result.banner ? (
        <Notice title="身近に頼れる方がいない場合について" tone="caution">
          {result.banner}
        </Notice>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-ohana-ink sm:text-3xl">
          今、確認できていること（{result.a.length}件）
        </h2>
        {result.a.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {result.a.map((fact, index) => (
              <li
                key={fact}
                className={`rounded-xl border border-ohana-beige-dark bg-ohana-white p-4 text-base leading-loose text-ohana-ink sm:text-lg ${
                  index >= PRINT_VISIBLE_A_LIMIT ? "print:hidden" : ""
                }`}
              >
                {fact}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base leading-loose text-ohana-gray sm:text-lg">
            今回の回答では、確認できていることはありませんでした。
          </p>
        )}
        {result.a.length > PRINT_VISIBLE_A_LIMIT ? (
          <p className="hidden text-sm text-ohana-gray print:block">
            そのほか{result.a.length - PRINT_VISIBLE_A_LIMIT}件確認できています。
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-ohana-ink sm:text-3xl">これから確認・話し合うこと</h2>
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          上から1つだけで十分です。全部を今日決める必要はありません。
        </p>
        {result.bTop3.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {result.bTop3.map((item) => (
              <ResultCard key={item.fact} item={item} />
            ))}
          </ul>
        ) : (
          <p className="text-base leading-loose text-ohana-gray sm:text-lg">
            今回の回答では、特に確認・話し合うことはありませんでした。
          </p>
        )}

        {result.bRest.length > 0 ? (
          <div className="no-print flex flex-col gap-3">
            {showRest ? (
              <ul className="flex flex-col gap-3">
                {result.bRest.map((item) => (
                  <ResultCard key={item.fact} item={item} />
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={() => setShowRest((prev) => !prev)}
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border-2 border-ohana-green px-5 py-2 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
            >
              {showRest ? "そのほかを閉じる" : "そのほかを見る"}
            </button>
          </div>
        ) : null}
      </section>

      {consultAreas.length > 0 ? (
        <p className="text-sm leading-loose text-ohana-gray sm:text-base">
          相談できる領域：{consultAreas.join("／")}
        </p>
      ) : null}
      <p className="text-sm text-ohana-gray">作成日：{createdAt}</p>

      <div className="no-print rounded-2xl bg-ohana-beige p-6">
        <Link
          href={{ pathname: "/contact", query: { result: resultPath } }}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark"
        >
          どこに相談すればよいか整理する
        </Link>
      </div>

      <DiagnosisShareActionsPre resultPath={resultPath} shareAudienceLabel={result.shareAudienceLabel} />

      <nav aria-label="この結果ページのその他のリンク" className="no-print flex flex-wrap gap-3 border-t border-ohana-beige-dark pt-6">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-sm font-semibold text-ohana-white hover:bg-ohana-green-dark"
        >
          House OHANAのトップへ戻る
        </Link>
        <Link
          href="/diagnosis?m=pre"
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
        >
          もう一度整理する
        </Link>
      </nav>
    </div>
  );
}
