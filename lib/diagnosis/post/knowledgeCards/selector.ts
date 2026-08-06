import type { KnowledgeCardMatch, KnowledgeCardRegistryEntry, PostKnowledgeCard } from "./types";
import { KNOWLEDGE_CARD_ORDER } from "./types";
import { getWhyNow } from "./reasons";
import { KNOWLEDGE_CARD_REGISTRY } from "./registry";

const MAX_KNOWLEDGE_CARDS = 2;

type MatchedTrue = Extract<KnowledgeCardMatch, { matched: true }>;

/**
 * matcher結果（KnowledgeCardMatch[]）から、画面表示用のPostKnowledgeCard[]を組み立てる。
 * Answers・PostVariables・questions・actions・contactsの選択ロジック・UIは参照しない。
 * registry・content・matcher結果・actions・contacts・unknownItemsを変更しない。
 * content readiness（isContentReadyToEnable）の再判定は行わない。enabledのみを表示可否の
 * 根拠とする。
 *
 * registryは第2引数として渡せる（省略時は本番KNOWLEDGE_CARD_REGISTRYを使用）。本番registry
 * は書き換えず、テストでは別のreadonly registryを都度生成して渡すこと。
 */
export function selectKnowledgeCards(
  matches: readonly KnowledgeCardMatch[],
  registry: readonly KnowledgeCardRegistryEntry[] = KNOWLEDGE_CARD_REGISTRY,
): readonly PostKnowledgeCard[] {
  const registryByCardId = new Map(registry.map((entry) => [entry.content.id, entry] as const));

  const matchedTrue: MatchedTrue[] = [];
  for (const match of matches) {
    if (!match.matched) continue;
    const entry = registryByCardId.get(match.cardId);
    if (!entry || !entry.enabled) continue;
    matchedTrue.push(match);
  }

  const sorted = [...matchedTrue].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return KNOWLEDGE_CARD_ORDER.indexOf(a.cardId) - KNOWLEDGE_CARD_ORDER.indexOf(b.cardId);
  });

  return sorted.slice(0, MAX_KNOWLEDGE_CARDS).map((match) => {
    // 上のループでenabledなregistry entryの存在を確認済みのため、ここでは必ず見つかる。
    const content = registryByCardId.get(match.cardId)!.content;
    const card: PostKnowledgeCard = {
      id: content.id,
      title: content.title,
      cliff: content.cliff,
      whyNow: getWhyNow(match.reasonId),
      checkItems: content.checkItems,
      linkedContactIds: content.linkedContactIds,
      sources: content.sources,
      verifiedAt: content.verifiedAt,
      reviewBy: content.reviewBy,
      rank: match.rank,
      urgency: match.urgency,
    };
    return card;
  });
}
