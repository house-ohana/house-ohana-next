import Link from "next/link";
import type { DiagnosisSummary } from "@/lib/diagnosis/types";
import Notice from "./Notice";
import DiagnosisShareActions from "./DiagnosisShareActions";

type Props = {
  summary: DiagnosisSummary;
  resultPath: string;
};

const sections: {
  key: keyof DiagnosisSummary;
  title: string;
  description: string;
}[] = [
  {
    key: "now",
    title: "今すぐ確認すること",
    description: "現時点の状況をもとに、早めに確認しておくとよい項目です。",
  },
  {
    key: "family",
    title: "家族で話し合うこと",
    description: "本人と家族、または家族同士で、話す機会をつくるとよい項目です。",
  },
  {
    key: "professional",
    title: "専門職へ確認すること",
    description: "病院・ケアマネジャー・施設相談員など、専門職へ確認するとよい項目です。",
  },
  {
    key: "later",
    title: "後から検討できること",
    description: "今すぐ結論を出さなくても、時間をかけて考えられる項目です。",
  },
];

export default function DiagnosisResultSections({ summary, resultPath }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-ohana-ink sm:text-3xl">整理結果</h2>
        <p className="mt-2 text-base leading-loose text-ohana-gray">
          ご回答いただいた内容をもとに、確認するとよいことを4つの視点に整理しました。
        </p>
      </div>

      <Notice title="この結果について" tone="caution">
        この結果は、医療診断、介護認定、法律判断、税務判断ではありません。現在の状況を整理し、関係する専門職へ確認するための参考情報です。
      </Notice>

      <div className="grid gap-6 sm:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.key}
            className="flex flex-col gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-6"
          >
            <h3 className="text-lg font-bold text-ohana-ink">{section.title}</h3>
            <p className="text-sm text-ohana-gray">{section.description}</p>
            <ul className="flex flex-col gap-2">
              {summary[section.key].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-loose text-ohana-ink/90 sm:text-base">
                  <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-ohana-beige p-6">
        <p className="text-base font-bold text-ohana-ink">結果の保存について</p>
        <p className="text-sm leading-loose text-ohana-ink/90 sm:text-base">
          このページをブックマークすると、後から同じ整理結果を確認できます。
        </p>
        <p className="text-sm leading-loose text-ohana-ink/90 sm:text-base">
          状況が変わったら、いつでももう一度整理できます。このページを保存しておくと、ご家族で話し合うときや、専門家へ相談するときにも使えます。
        </p>
      </div>

      <DiagnosisShareActions resultPath={resultPath} />

      <nav aria-label="この結果ページのその他のリンク" className="flex flex-wrap gap-3 border-t border-ohana-beige-dark pt-6">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-sm font-semibold text-ohana-white hover:bg-ohana-green-dark"
        >
          House OHANAのトップへ戻る
        </Link>
        <Link
          href="/diagnosis"
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
        >
          もう一度3分整理ナビを行う
        </Link>
        <Link
          href="/family"
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
        >
          関連するケースを見る
        </Link>
        <Link
          href={{ pathname: "/contact", query: { result: resultPath } }}
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-green px-6 py-3 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
        >
          この結果をもとに相談する
        </Link>
      </nav>

      <div className="flex flex-col gap-4 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">ご家族だけで整理するのが難しいときは</h2>
        <p className="text-sm leading-loose text-ohana-gray sm:text-base">
          結果を見ても、何から始めるべきか迷う場合があります。House
          OHANAでは、現在の状況を一緒に整理し、必要に応じて相談先を考えるお手伝いをします。無理にサービスを勧めることはありません。
        </p>
        <div>
          <Link
            href={{ pathname: "/contact", query: { result: resultPath } }}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark"
          >
            この結果をもとに相談する
          </Link>
        </div>
      </div>
    </div>
  );
}
