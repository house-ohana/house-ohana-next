import type { PostContactCard, PostValidAnswers } from "../types";
import type { PostVariables } from "../variables";
import type { ExistingContactId, KnowledgeCardRegistryEntry, PostKnowledgeCard } from "./types";
import { KNOWLEDGE_CARD_REGISTRY } from "./registry";
import { matchKnowledgeCards } from "./matchers";
import { selectKnowledgeCards } from "./selector";

/**
 * Phase4.1知識カード（matchKnowledgeCards→selectKnowledgeCards）のオーケストレータ。
 * 新しい発火条件・reasonId・rank・urgency・最大件数・content本文・whyNow本文・readinessは
 * 一切判定しない。matchとselectを接続するだけの純粋関数。
 * 第3引数のregistryは単体テストでenabled状態を注入するためのもの。省略時は本番
 * KNOWLEDGE_CARD_REGISTRYを使用する（本番は3件ともenabled: falseのため、常に空配列を返す）。
 */
export function buildKnowledgeCards(
  answers: PostValidAnswers,
  variables: PostVariables,
  registry: readonly KnowledgeCardRegistryEntry[] = KNOWLEDGE_CARD_REGISTRY,
): PostKnowledgeCard[] {
  const matches = matchKnowledgeCards(answers, variables);
  return [...selectKnowledgeCards(matches, registry)];
}

/**
 * 各カードのlinkedContactIdsを、実際のPostResult.contactsとの積集合へ変換する純粋関数。
 * 固定content側の情報だけを理由にcontactsを新設・削除・並べ替えはしない（積集合はcontacts側
 * ではなく、各カードのlinkedContactIdsの順序を維持する）。同一IDが複数回あっても最初の1件だけ
 * 残す。積集合が空になってもカード自体は削除しない（cliff・checkItems等、linkedContactIds以外
 * のフィールドはそのまま）。cards・contacts・card.linkedContactIdsのいずれも変更しない。
 */
export function projectKnowledgeCardLinkedContacts(
  cards: readonly PostKnowledgeCard[],
  contacts: readonly PostContactCard[],
): PostKnowledgeCard[] {
  const contactIds = new Set(contacts.map((contact) => contact.id));

  return cards.map((card) => {
    const seen = new Set<ExistingContactId>();
    const linkedContactIds: ExistingContactId[] = [];
    for (const id of card.linkedContactIds) {
      if (seen.has(id)) continue;
      if (!contactIds.has(id)) continue;
      seen.add(id);
      linkedContactIds.push(id);
    }
    return { ...card, linkedContactIds };
  });
}

/**
 * PostResultへ格納する最終的なPostKnowledgeCard[]を組み立てるラッパー。
 * buildKnowledgeCards（matcher→selector）を1回だけ呼び、その選択結果へ
 * projectKnowledgeCardLinkedContactsを適用するだけで、カードの選択・順序・rank・urgencyの
 * 再判定は行わない。第4引数のregistryは単体テスト用（省略時は本番KNOWLEDGE_CARD_REGISTRY）。
 */
export function buildKnowledgeCardsForPostResult(
  answers: PostValidAnswers,
  variables: PostVariables,
  contacts: readonly PostContactCard[],
  registry: readonly KnowledgeCardRegistryEntry[] = KNOWLEDGE_CARD_REGISTRY,
): PostKnowledgeCard[] {
  const cards = buildKnowledgeCards(answers, variables, registry);
  return projectKnowledgeCardLinkedContacts(cards, contacts);
}
