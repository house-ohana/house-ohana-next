import Link from "next/link";
import type { PostResult } from "@/lib/diagnosis/post/types";
import Notice from "./Notice";
import DiagnosisShareActions from "./DiagnosisShareActions";
import { GUIDANCE_DISCLAIMER, INSURANCE_GUIDANCE_TEXT } from "@/lib/diagnosis/post/guidanceContent";
import { CONSULTATION_COPY } from "@/lib/diagnosis/post/consultation";
import {
  FIRST_ACTION_REASON_TEXT,
  FIRST_ACTION_SUPPLEMENT_TEXT,
  FIRST_ACTION_CHECKLIST,
  FIRST_ACTION_SHORT_HEADLINE,
  CONSULTATION_PREP_ITEMS,
} from "@/lib/diagnosis/post/resultDisplayText";

type Props = {
  result: PostResult;
  resultPath: string;
};

// 「進める前に、ひと確認」に集約する、契約理解の不安に関する既存insight（第5節）
const HOLD_ON_INSIGHT_IDS = new Set(["contract_concern_with_home", "contract_status_unknown_with_home"]);
const HOLD_ON_DEADLINE = "契約前";

// 表示専用の要約（意味を変えず、最初の文だけを取り出す。新しい文章は作らない）
function firstSentence(text: string): string {
  const index = text.indexOf("。");
  return index === -1 ? text : text.slice(0, index + 1);
}

/**
 * Phase 2以降で知識カード（KnowledgeCard）を追加する際の受け皿。
 * 現時点ではPostResultに該当データが存在しないため常に空配列とし、何も表示しない
 * （該当のない空カードは表示しない、という既存原則を維持する）。カードを追加する場合は
 * このファイルではなく、buildPostResult側からFutureKnowledgeCard[]を渡す配線を追加すること。
 */
type FutureKnowledgeCard = {
  id: string;
  summary?: string;
  nextStep?: string;
  contact?: string;
  detail: string;
  sources?: { organization: string; title: string; url: string }[];
};
const FUTURE_KNOWLEDGE_CARDS: FutureKnowledgeCard[] = [];

function KnowledgeCardList({ cards }: { cards: FutureKnowledgeCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-lg font-bold text-ohana-ink">詳しく知りたい方へ</h3>
      <div className="flex flex-col gap-4">
        {cards.map((card) => (
          <div key={card.id} className="flex flex-col gap-2 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-5">
            {card.summary ? <p className="text-base font-semibold text-ohana-ink">{card.summary}</p> : null}
            {card.nextStep ? <p className="text-sm leading-loose text-ohana-ink/90">次にすること：{card.nextStep}</p> : null}
            {card.contact ? <p className="text-sm leading-loose text-ohana-ink/90">確認先：{card.contact}</p> : null}
            <p className="text-sm leading-loose text-ohana-ink/90">{card.detail}</p>
            {card.sources && card.sources.length > 0 ? (
              <details className="text-sm text-ohana-gray">
                <summary className="cursor-pointer select-none">▼ 根拠・出典</summary>
                <ul className="mt-2 flex flex-col gap-1">
                  {card.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer" className="underline">
                        {source.organization}｜{source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

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
            {item.contact}へ{item.title}
            <span className="ml-2 rounded-full bg-ohana-beige px-2 py-0.5 text-xs font-semibold text-ohana-brown">
              {item.deadline}
            </span>
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
  const shortSituation = firstSentence(result.situation);
  const reasonText = FIRST_ACTION_REASON_TEXT[result.firstAction.id];
  const supplementText = FIRST_ACTION_SUPPLEMENT_TEXT[result.firstAction.id];
  const shortHeadline = FIRST_ACTION_SHORT_HEADLINE[result.firstAction.id] ?? result.firstAction.headline;
  const checklist = FIRST_ACTION_CHECKLIST[result.firstAction.id] ?? [result.firstAction.headline];

  // 「進める前に、ひと確認」（第3節⑤）: 既存のinsights/nextActions/contactsから、
  // 不可逆・契約関連の既存シグナルだけを集約する。新しい該当判定は作らない。
  const holdOnInsights = result.insights.filter((insight) => HOLD_ON_INSIGHT_IDS.has(insight.id));
  const holdOnNextActions = result.nextActions.filter((action) => action.deadline === HOLD_ON_DEADLINE);
  const holdOnLegalContact = result.contacts.find((contact) => contact.id === "legal");
  const hasHoldOn = holdOnInsights.length > 0 || holdOnNextActions.length > 0 || Boolean(holdOnLegalContact);

  const remainingInsights = result.insights.filter((insight) => !HOLD_ON_INSIGHT_IDS.has(insight.id));
  const remainingNextActions = result.nextActions.filter((action) => action.deadline !== HOLD_ON_DEADLINE);
  // ⑤に「実家を売る・貸す」文脈が出ている場合、⑦の同趣旨の項目と矛盾して見えないよう、
  // その1項目だけを表示層で除外する（decisions.tsのロジック・データは変更しない）。
  const decideLaterFiltered = hasHoldOn
    ? result.decideLater.filter((item) => item !== "実家を最終的に残す・貸す・売るか")
    : result.decideLater;

  const hasDecideNow = result.decideNow.length > 0;
  const hasDecideLater = decideLaterFiltered.length > 0;
  const hasWeeklyChecklist = hasDecideNow || remainingNextActions.length > 0 || hasHoldOn;
  const hasInsights = remainingInsights.length > 0;
  const hasContacts = result.contacts.length > 0;
  const hasSelfHelp = result.selfHelp.length > 0;
  const hasAskProfessional = result.askProfessional.length > 0;

  return (
    <div className="flex flex-col gap-12">
      {/* 1. あなたの状況 + 2. まず、ここから（今日）: スマホの初期表示だけで理解できる範囲。
          この2つ以外はここに置かない（家族が3秒で理解できることを最優先する）。 */}
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-bold text-ohana-brown">あなたの状況</h2>
          <p className="mt-1 text-base leading-loose text-ohana-ink sm:text-lg">{shortSituation}</p>
        </div>

        <div className="rounded-2xl border-2 border-ohana-green bg-ohana-green-light p-5 sm:p-7">
          <h2 className="text-sm font-bold tracking-wide text-ohana-green-dark">まず、ここから（今日）</h2>
          <p className="mt-2 text-xl font-bold leading-snug text-ohana-ink sm:text-2xl">{shortHeadline}</p>
          {supplementText ? <p className="mt-2 text-sm leading-loose text-ohana-ink/80 sm:text-base">{supplementText}</p> : null}

          {/* 理由・内訳・元の文面は重要度が低いため折りたたむ（削除はしない） */}
          <details className="mt-4 border-t border-ohana-green/25 pt-3">
            <summary className="cursor-pointer select-none text-sm font-semibold text-ohana-green-dark">詳しく見る</summary>
            <div className="mt-3 flex flex-col gap-3">
              {reasonText ? <p className="text-sm leading-loose text-ohana-ink/80">{reasonText}</p> : null}
              <ul className="flex flex-col gap-2">
                {checklist.slice(0, 3).map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-loose text-ohana-ink">
                    <span className="mt-1 h-3.5 w-3.5 flex-none rounded border-2 border-ohana-green" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {shortHeadline !== result.firstAction.headline ? (
                <p className="text-xs leading-loose text-ohana-ink/60">{result.firstAction.headline}</p>
              ) : null}
            </div>
          </details>
        </div>
      </div>

      {/* 3. 1週間以内に確認しましょう（⑤進める前に、ひと確認／今決めること／今週のうちに見ておきたいこと） */}
      {hasWeeklyChecklist ? (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">1週間以内に確認しましょう</h2>

          {hasHoldOn ? (
            <section className="flex flex-col gap-3 rounded-2xl border-2 border-ohana-brown bg-ohana-brown-light p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ohana-ink">
                <span className="rounded-full bg-ohana-brown px-2 py-0.5 text-xs font-semibold text-ohana-white">先に確認</span>
                進める前に、ひと確認
              </h3>
              {holdOnInsights.map((insight) => (
                <p key={insight.id} className="text-base leading-loose text-ohana-ink sm:text-lg">
                  {insight.body}
                </p>
              ))}
              {holdOnNextActions.map((action) => (
                <p key={`${action.contact}-${action.title}`} className="text-base leading-loose text-ohana-ink sm:text-lg">
                  {action.contact}へ、{action.title}
                </p>
              ))}
              {holdOnLegalContact && holdOnInsights.length === 0 && holdOnNextActions.length === 0 ? (
                <p className="text-base leading-loose text-ohana-ink sm:text-lg">
                  実家の売却・賃貸などを進める前に、{holdOnLegalContact.name}へ一度確認しておくと安心です。
                </p>
              ) : null}
            </section>
          ) : null}

          {hasDecideNow ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-ohana-ink">今決めること</h3>
              <TextList items={result.decideNow} />
            </section>
          ) : null}

          {remainingNextActions.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-ohana-ink">今週のうちに見ておきたいこと</h3>
              <NextActionList items={remainingNextActions} />
            </section>
          ) : null}
        </div>
      ) : null}

      {/* 4. 今後のために知っておきたいこと（後回し／気を付けたいこと／窓口／自分でできること・専門家に確認すること／詳しく知りたい方へ）
          重要度が低い（今すぐでなくてよい）内容のため、折りたたみ表示にする */}
      <details className="flex flex-col gap-6">
        <summary className="cursor-pointer select-none rounded-2xl bg-ohana-beige px-5 py-4 text-lg font-bold text-ohana-ink sm:px-6 sm:text-xl">
          今後のために知っておきたいこと
        </summary>

        {hasDecideLater ? (
          <section className="flex flex-col gap-3 rounded-2xl bg-ohana-beige p-5 sm:p-6">
            <h3 className="text-lg font-bold text-ohana-ink">今は、後回しでも大丈夫</h3>
            <TextList items={decideLaterFiltered} dotClassName="bg-ohana-brown" />
            {result.decideLaterCaveat ? (
              <p className="text-sm leading-loose text-ohana-ink/80 sm:text-base">
                最終決定は後でもよいですが、期限や手続の有無だけは先に確認しておきましょう。
              </p>
            ) : null}
            <p className="text-sm leading-loose text-ohana-ink/80 sm:text-base">
              一度に全部を決める必要はありません。今日できることから、一つずつ進めていけば大丈夫です。
            </p>
          </section>
        ) : null}

        {hasInsights ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-lg font-bold text-ohana-ink">気を付けたいこと</h3>
            <ul className="flex flex-col gap-3">
              {remainingInsights.map((insight) => (
                <li key={insight.id} className="flex flex-col gap-2 rounded-xl border border-ohana-beige-dark bg-ohana-white p-4">
                  <p className="text-base leading-loose text-ohana-ink sm:text-lg">{insight.body}</p>
                  {insight.footnote ? <p className="text-sm leading-loose text-ohana-gray">{insight.footnote}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {hasContacts ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-lg font-bold text-ohana-ink">誰に、何を確認するか</h3>
            <div className="flex flex-col gap-4">
              {result.contacts.map((contact) => (
                <div key={contact.id} className="flex flex-col gap-2 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-5">
                  <h4 className="text-base font-bold text-ohana-ink">{contact.name}</h4>
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

        <KnowledgeCardList cards={FUTURE_KNOWLEDGE_CARDS} />
      </details>

      {/* 5. 相談の前に準備すると良いこと（固定セクション。回答に依存しない） */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-ohana-ink sm:text-2xl">相談の前に準備すると良いこと</h2>
        <TextList items={CONSULTATION_PREP_ITEMS} />
      </section>

      {/* 結果の保存・共有 */}
      <div className="flex flex-col gap-3 rounded-2xl bg-ohana-beige p-6">
        <p className="text-base font-bold text-ohana-ink">結果の保存について</p>
        <p className="text-sm leading-loose text-ohana-ink/90 sm:text-base">
          このページをブックマークすると、後から同じ整理結果を確認できます。状況が変わったら、いつでももう一度整理できます。
        </p>
      </div>
      <DiagnosisShareActions resultPath={resultPath} />

      {/* OHANA相談窓口（第11節: 結果本体と視覚的に分離する。両方該当する場合は緊急側を先に表示する） */}
      <div className="flex flex-col gap-6 rounded-2xl bg-ohana-beige p-6 sm:p-8">
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
            <h2 className="text-lg font-bold text-ohana-ink">{CONSULTATION_COPY.normal.lead}</h2>
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

      {/* 免責事項 */}
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
