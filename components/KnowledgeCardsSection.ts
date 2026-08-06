import { createElement, type ReactElement } from "react";
import type { PostKnowledgeCard } from "../lib/diagnosis/post/knowledgeCards/types";
import type { PostContactCard } from "../lib/diagnosis/post/types";

// このファイルはJSXを使用せずReact.createElementで記述している。
// lib/diagnosis/post/__tests__配下のnode:testはNodeのTS実行機能で直接実行され、JSX（.tsx）を
// 解釈できないため（.tsxはNodeの型ストリッピング対象外）。本番の描画結果はJSXで書いた場合と
// 同一であり、DiagnosisResultSections.tsx側の呼び出し方・propsも変わらない。

type Props = {
  cards: readonly PostKnowledgeCard[];
  contacts: readonly PostContactCard[];
};

/**
 * card.linkedContactIdsのうち、実際にPostResult.contactsへ含まれるものだけを、
 * linkedContactIdsの順番のまま重複なく返す（固定content側の根拠だけで相談先を追加しない）。
 */
export function matchedContacts(card: PostKnowledgeCard, contacts: readonly PostContactCard[]): PostContactCard[] {
  const contactById = new Map(contacts.map((contact) => [contact.id, contact] as const));
  const seen = new Set<string>();
  const result: PostContactCard[] = [];
  for (const id of card.linkedContactIds) {
    if (seen.has(id)) continue;
    const contact = contactById.get(id);
    if (!contact) continue;
    seen.add(id);
    result.push(contact);
  }
  return result;
}

function renderCheckItems(items: readonly string[]): ReactElement {
  return createElement(
    "div",
    { className: "flex flex-col gap-2" },
    createElement("h4", { className: "text-sm font-bold text-ohana-ink" }, "確認すること"),
    createElement(
      "ul",
      { className: "flex flex-col gap-1.5" },
      items.map((item) =>
        createElement(
          "li",
          { key: item, className: "flex gap-2 text-sm leading-loose text-ohana-ink/90 sm:text-base" },
          createElement("span", { className: "mt-2 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green", "aria-hidden": "true" }),
          createElement("span", null, item),
        ),
      ),
    ),
  );
}

function renderContacts(contactsForCard: readonly PostContactCard[]): ReactElement | null {
  if (contactsForCard.length === 0) return null;
  return createElement(
    "div",
    { className: "flex flex-col gap-2" },
    createElement("h4", { className: "text-sm font-bold text-ohana-ink" }, "関連する相談先"),
    createElement(
      "ul",
      { className: "flex flex-col gap-1.5" },
      contactsForCard.map((contact) =>
        createElement(
          "li",
          { key: contact.id, className: "flex gap-2 text-sm leading-loose text-ohana-ink/90 sm:text-base" },
          createElement("span", { className: "mt-2 h-1.5 w-1.5 flex-none rounded-full bg-ohana-brown", "aria-hidden": "true" }),
          createElement("span", null, contact.name),
        ),
      ),
    ),
  );
}

function renderSources(sources: PostKnowledgeCard["sources"]): ReactElement | null {
  if (sources.length === 0) return null;
  return createElement(
    "div",
    { className: "flex flex-col gap-1 border-t border-ohana-beige-dark pt-3" },
    createElement("h4", { className: "text-xs font-bold text-ohana-gray" }, "参考情報"),
    createElement(
      "ul",
      { className: "flex flex-col gap-1" },
      sources.map((source) =>
        createElement(
          "li",
          { key: source.url, className: "text-xs leading-loose text-ohana-gray" },
          createElement(
            "a",
            { href: source.url, target: "_blank", rel: "noopener noreferrer", className: "underline" },
            `${source.organization}｜${source.title}`,
          ),
        ),
      ),
    ),
  );
}

/**
 * Phase4.1「見落としやすい崖」知識カードの表示専用component。
 * PostResult.knowledgeCards（matcher/selectorで確定済み）をそのまま描画するだけで、
 * 発火条件・reasonId・rank・urgency・最大件数・相談先の新規生成は一切行わない。
 * 本番registryは全件enabled: falseのため、通常のbuildPostResultではcardsは常に空配列であり、
 * その場合この関数はnullを返す（見出し・wrapper・余白を一切出力しない）。
 */
export default function KnowledgeCardsSection({ cards, contacts }: Props): ReactElement | null {
  if (cards.length === 0) return null;

  return createElement(
    "section",
    { "aria-labelledby": "knowledge-cards-heading", className: "flex flex-col gap-6" },
    createElement(
      "h2",
      { id: "knowledge-cards-heading", className: "text-xl font-bold text-ohana-ink sm:text-2xl" },
      "今、見落とさないために",
    ),
    createElement(
      "div",
      { className: "flex flex-col gap-4" },
      cards.map((card) => {
        const contactsForCard = matchedContacts(card, contacts);
        return createElement(
          "article",
          { key: card.id, className: "flex flex-col gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-5 sm:p-6" },
          createElement("h3", { className: "text-lg font-bold text-ohana-ink" }, card.title),
          createElement("p", { className: "text-base leading-loose text-ohana-ink sm:text-lg" }, card.cliff),
          createElement(
            "p",
            { className: "text-sm leading-loose text-ohana-ink/80 sm:text-base" },
            `今、確認したい理由：${card.whyNow}`,
          ),
          renderCheckItems(card.checkItems),
          renderContacts(contactsForCard),
          renderSources(card.sources),
        );
      }),
    ),
  );
}
