import Link from "next/link";
import type { DiagnosisResult, DiagnosisSummary } from "@/lib/diagnosis/types";
import Notice from "./Notice";
import DiagnosisShareActions from "./DiagnosisShareActions";
import DiagnosisPerspectives from "./DiagnosisPerspectives";

type Props = {
  result: DiagnosisResult;
  resultPath: string;
};

const perspectiveSections: {
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

const consultConditions = [
  "家族の意見が分かれている",
  "退院期限が迫っている",
  "本人と家族の希望が異なる",
  "どの専門職に相談するか決められない",
  "実家・費用・介護の問題が重なっている",
];

function DecisionList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2 rounded-xl border border-ohana-beige-dark bg-ohana-white p-4 text-base leading-loose text-ohana-ink"
        >
          <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DiagnosisResultSections({ result, resultPath }: Props) {
  const hasFamily = result.familyDecisions.length > 0;
  const hasProfessional = result.professionalDecisions.length > 0;
  const hasLater = result.laterDecisions.length > 0;
  const hasQuestions = result.readyQuestions.length > 0;
  const hasNextStep = result.nextStep.contacts.length > 0 || result.nextStep.showOhana;

  return (
    <div className="flex flex-col gap-10">
      {/* 1. あなたの状況 + 2. まず最初にすること: スマホの初期表示で見える範囲 */}
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-bold text-ohana-brown">あなたの状況</h2>
          <p className="mt-1 text-base leading-loose text-ohana-ink sm:text-lg">{result.situation}</p>
        </div>

        <div className="rounded-2xl border-2 border-ohana-green bg-ohana-green-light p-5 sm:p-7">
          <h2 className="text-sm font-bold tracking-wide text-ohana-green-dark">まず最初にすること</h2>
          <p className="mt-2 text-xl font-bold leading-snug text-ohana-ink sm:text-2xl">
            {result.firstAction.headline}
          </p>
          {result.firstAction.note ? (
            <p className="mt-2 text-sm leading-loose text-ohana-ink/80 sm:text-base">{result.firstAction.note}</p>
          ) : null}
        </div>
      </div>

      {/* 3. 今回整理すること */}
      {(hasFamily || hasProfessional || hasLater) ? (
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-ohana-ink sm:text-3xl">今回整理すること</h2>

          {hasFamily ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-ohana-ink">今、家族で決めること</h3>
              <DecisionList items={result.familyDecisions} />
            </section>
          ) : null}

          {hasProfessional ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-ohana-ink">専門職に確認してから決めること</h3>
              <DecisionList items={result.professionalDecisions} />
            </section>
          ) : null}

          {hasLater ? (
            <section className="flex flex-col gap-3 rounded-2xl bg-ohana-beige p-5 sm:p-6">
              <h3 className="text-lg font-bold text-ohana-ink">今は決めなくてよいこと</h3>
              <p className="text-sm leading-loose text-ohana-gray sm:text-base">
                現在の最優先課題を確認したあとで考えられることです。今回は考える対象から外してかまいません。
              </p>
              <ul className="flex flex-col gap-2.5">
                {result.laterDecisions.map((item) => (
                  <li key={item} className="flex gap-2 text-base leading-loose text-ohana-ink">
                    <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-brown" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {/* 4. そのまま使える質問 */}
      {hasQuestions ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-ohana-ink sm:text-3xl">そのまま使える質問</h2>
          <p className="text-sm leading-loose text-ohana-gray sm:text-base">
            病院・ケアマネジャー・地域包括支援センター・ご家族などへ、そのまま伝えられる質問です。
          </p>
          <ul className="flex flex-col gap-2.5">
            {result.readyQuestions.map((question) => (
              <li
                key={question}
                className="rounded-xl border border-ohana-beige-dark bg-ohana-white p-4 text-base leading-loose text-ohana-ink sm:text-lg"
              >
                「{question}」
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Notice title="この結果について" tone="caution">
        この結果は、医療診断、介護認定、法律判断、税務判断ではありません。現在の状況を整理し、関係する専門職へ確認するための参考情報です。
      </Notice>

      {/* 5. 詳しく整理すると（既存の4つの視点・折りたたみ） */}
      <DiagnosisPerspectives sections={perspectiveSections} summary={result.perspectives} />

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

      {/* 6. 相談誘導文 */}
      <div className="flex flex-col gap-4 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">
          次のような場合は、個別の状況整理をご利用ください
        </h2>
        <ul className="flex flex-col gap-2">
          {consultConditions.map((condition) => (
            <li key={condition} className="flex gap-2 text-base leading-loose text-ohana-ink">
              <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
              <span>{condition}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-loose text-ohana-gray sm:text-base">
          3分整理の結果をもとに、相談先と確認事項を一緒に整理します。
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

      {/* 次の一歩：追加で相談先になり得る相手（該当する場合のみ表示） */}
      {hasNextStep ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">次の一歩</h2>
          <p className="text-sm leading-loose text-ohana-gray sm:text-base">
            この結果をもとに、次に相談してみるとよい相手です。
          </p>
          <ul className="flex flex-col gap-2">
            {result.nextStep.contacts.map((contact) => (
              <li key={contact} className="flex gap-2 text-base leading-loose text-ohana-ink">
                <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
                <span>{contact}</span>
              </li>
            ))}
            {result.nextStep.showOhana ? (
              <li className="flex gap-2 text-base leading-loose text-ohana-ink">
                <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
                <span>
                  保険や実家の整理など、複数の分野にまたがる内容については、House
                  OHANAでも状況整理のお手伝いをしています。お気軽にご質問ください。
                </span>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
