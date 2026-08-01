import Link from "next/link";
import type { PostResult } from "@/lib/diagnosis/post/types";
import Notice from "./Notice";
import DiagnosisShareActions from "./DiagnosisShareActions";
import { GUIDANCE_DISCLAIMER, INSURANCE_GUIDANCE_TEXT } from "@/lib/diagnosis/post/guidanceContent";
import { CONSULTATION_COPY } from "@/lib/diagnosis/post/consultation";

type Props = {
  result: PostResult;
  resultPath: string;
};

function NextActionList({ items }: { items: PostResult["nextActions"] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li
          key={`${item.deadline}-${item.contact}-${item.title}`}
          className="flex gap-2 rounded-xl border border-ohana-beige-dark bg-ohana-white p-4 text-base leading-loose text-ohana-ink"
        >
          <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
          <span>
            <span className="font-semibold">{item.deadline}</span>｜{item.contact}へ{item.title}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TextList({ items, dotClassName = "bg-ohana-green" }: { items: string[]; dotClassName?: string }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-base leading-loose text-ohana-ink">
          <span className={`mt-2.5 h-1.5 w-1.5 flex-none rounded-full ${dotClassName}`} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DiagnosisResultSections({ result, resultPath }: Props) {
  const hasNextActions = result.nextActions.length > 0;
  const hasDecideNow = result.decideNow.length > 0;
  const hasDecideLater = result.decideLater.length > 0;
  const hasInsights = result.insights.length > 0;
  const hasContacts = result.contacts.length > 0;
  const hasSelfHelp = result.selfHelp.length > 0;
  const hasAskProfessional = result.askProfessional.length > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* ①あなたの状況 + ②まず最初にすること: スマホの初期表示で見える範囲（第7節） */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-ohana-brown">あなたの状況</h2>
          <p className="mt-1 text-base leading-loose text-ohana-ink sm:text-lg">{result.situation}</p>
        </div>

        <div className="rounded-2xl border-2 border-ohana-green bg-ohana-green-light p-5 sm:p-7">
          <h2 className="text-sm font-bold tracking-wide text-ohana-green-dark">まず最初にすること</h2>
          <p className="mt-2 text-xl font-bold leading-snug text-ohana-ink sm:text-2xl">{result.firstAction.headline}</p>
        </div>
      </div>

      {/* ③次に確認すること */}
      {hasNextActions ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">次に確認すること</h2>
          <NextActionList items={result.nextActions} />
        </section>
      ) : null}

      {/* ④今決めること／後で決めてよいこと */}
      {hasDecideNow || hasDecideLater ? (
        <div className="flex flex-col gap-6">
          {hasDecideNow ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">今決めること</h2>
              <TextList items={result.decideNow} />
            </section>
          ) : null}

          {hasDecideLater ? (
            <section className="flex flex-col gap-3 rounded-2xl bg-ohana-beige p-5 sm:p-6">
              <h2 className="text-lg font-bold text-ohana-ink">後で決めてよいこと</h2>
              <TextList items={result.decideLater} dotClassName="bg-ohana-brown" />
              {result.decideLaterCaveat ? (
                <p className="text-sm leading-loose text-ohana-ink/80 sm:text-base">
                  最終決定は後でもよいですが、期限や手続の有無だけは先に確認してください。
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      {/* ⑤知っておくと詰まりにくいこと */}
      {hasInsights ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">知っておくと詰まりにくいこと</h2>
          <ul className="flex flex-col gap-3">
            {result.insights.map((insight) => (
              <li key={insight.id} className="flex flex-col gap-2 rounded-xl border border-ohana-beige-dark bg-ohana-white p-4">
                <p className="text-base leading-loose text-ohana-ink sm:text-lg">{insight.body}</p>
                {insight.footnote ? <p className="text-sm leading-loose text-ohana-gray">{insight.footnote}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ⑥誰に、何を確認するか */}
      {hasContacts ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">誰に、何を確認するか</h2>
          <div className="flex flex-col gap-4">
            {result.contacts.map((contact) => (
              <div key={contact.id} className="flex flex-col gap-2 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-5">
                <h3 className="text-lg font-bold text-ohana-ink">{contact.name}</h3>
                {contact.note ? <p className="text-sm leading-loose text-ohana-gray">{contact.note}</p> : null}
                {contact.id === "fp" ? <p className="text-sm leading-loose text-ohana-gray">{INSURANCE_GUIDANCE_TEXT}</p> : null}
                <ul className="flex flex-col gap-1.5">
                  {contact.questions.map((question) => (
                    <li key={question} className="flex gap-2 text-sm leading-loose text-ohana-ink/90 sm:text-base">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ⑦自分たちでできること／専門家に確認すること */}
      {hasSelfHelp || hasAskProfessional ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {hasSelfHelp ? (
            <section className="flex flex-col gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-5">
              <h3 className="text-lg font-bold text-ohana-ink">自分たちでできること</h3>
              <TextList items={result.selfHelp} />
            </section>
          ) : null}
          {hasAskProfessional ? (
            <section className="flex flex-col gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-5">
              <h3 className="text-lg font-bold text-ohana-ink">専門家に確認すること</h3>
              <TextList items={result.askProfessional} dotClassName="bg-ohana-brown" />
            </section>
          ) : null}
        </div>
      ) : null}

      {/* ⑧結果の保存・共有 */}
      <div className="flex flex-col gap-3 rounded-2xl bg-ohana-beige p-6">
        <p className="text-base font-bold text-ohana-ink">結果の保存について</p>
        <p className="text-sm leading-loose text-ohana-ink/90 sm:text-base">
          このページをブックマークすると、後から同じ整理結果を確認できます。状況が変わったら、いつでももう一度整理できます。
        </p>
      </div>
      <DiagnosisShareActions resultPath={resultPath} />

      {/* ⑨OHANAへの相談導線（第16節・第17節。両方該当する場合は緊急側を先に表示する） */}
      <div className="flex flex-col gap-6">
        {result.consultation.urgent ? (
          <section className="flex flex-col gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">{CONSULTATION_COPY.urgent.lead}</h2>
            <p className="text-sm leading-loose text-ohana-gray sm:text-base">{CONSULTATION_COPY.urgent.body}</p>
            <div>
              <Link
                href={{ pathname: "/contact", query: { result: resultPath } }}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark"
              >
                {CONSULTATION_COPY.urgent.button}
              </Link>
            </div>
          </section>
        ) : null}

        {result.consultation.homeAndContract ? (
          <section className="flex flex-col gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">{CONSULTATION_COPY.homeAndContract.lead}</h2>
            <p className="text-sm leading-loose text-ohana-gray sm:text-base">{CONSULTATION_COPY.homeAndContract.body}</p>
            <div>
              <Link
                href={{ pathname: "/contact", query: { result: resultPath } }}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark"
              >
                {CONSULTATION_COPY.homeAndContract.button}
              </Link>
            </div>
          </section>
        ) : null}

        {!result.consultation.urgent && !result.consultation.homeAndContract ? (
          <section className="flex flex-col gap-3">
            <p className="text-sm leading-loose text-ohana-gray sm:text-base">{CONSULTATION_COPY.normal.body}</p>
            <div>
              <Link
                href={{ pathname: "/contact", query: { result: resultPath } }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-ohana-green px-5 py-2 text-sm font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
              >
                House OHANAへ相談する
              </Link>
            </div>
          </section>
        ) : null}
      </div>

      <nav aria-label="この結果ページのその他のリンク" className="flex flex-wrap gap-3 border-t border-ohana-beige-dark pt-6">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-sm font-semibold text-ohana-white hover:bg-ohana-green-dark"
        >
          House OHANAのトップへ戻る
        </Link>
        <Link
          href="/diagnosis?m=post"
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
      </nav>

      {/* ⑩免責事項 */}
      <Notice title="この結果について" tone="caution">
        <p>
          この結果は、医療診断、介護認定、法律判断、税務判断ではありません。現在の状況を整理し、関係する専門職へ確認するための参考情報です。House
          OHANAは、緊急の医療相談や救急対応を行う窓口ではありません。生命や身体に緊急性がある場合は、医療機関や公的な緊急窓口へご連絡ください。
        </p>
      </Notice>
      <p className="text-xs leading-loose text-ohana-gray">{GUIDANCE_DISCLAIMER}</p>
    </div>
  );
}
