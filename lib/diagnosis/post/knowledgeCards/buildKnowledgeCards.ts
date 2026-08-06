import type { PostValidAnswers } from "../types";
import type { PostVariables } from "../variables";
import type { KnowledgeCardRegistryEntry, PostKnowledgeCard } from "./types";
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
