import type { PostValidAnswers, C4Value, C5Value, C6Value, C7Value, CT1Value } from "../types";
import type { PostVariables } from "../variables";
import type { ArtifactFactItem } from "./types";
import { c2Fact, c3Fact, C4_FACT, C5_FACT, C6_FACT, C7_FACT, H1_FACT, CT1_FACT } from "./factPhrases";

const MAX_CONFIRMED_FACTS = 5;

// artifactPriorityが同値の場合のtie-break順（C2→C3→C4→C5→C6→C7→H1→CT1）。
const SOURCE_ORDER: Record<string, number> = {
  c2_deadline: 0,
  c3_residence: 1,
  c4_support: 2,
  c5_wishes: 3,
  c6_home_status: 4,
  c7_money: 5,
  h1_home_intent: 6,
  ct1_contract: 7,
};

type Candidate = ArtifactFactItem;

/**
 * 「今回整理できたこと」の候補を生成する。
 * 全8ソース（C2〜C7・H1・CT1）を単一の候補プールへ入れ、回答値ごとの固定artifactPriority
 * 昇順で並べ、dedupeGroupごとに1件へ絞った上で最大5件を返す。
 * variables.tsの確定フラグ・回答事実（answers）・固定変換表（factPhrases.ts）のみを参照し、
 * 生の回答値からの条件再判定は行わない。
 */
export function buildConfirmedFacts(answers: PostValidAnswers, variables: PostVariables): ArtifactFactItem[] {
  const candidates: Candidate[] = [];

  if (!variables.deadlineAnswerUnknown) {
    const f = c2Fact(answers);
    candidates.push({ id: "fact_c2_deadline", dedupeGroup: "c2_deadline", text: f.text, priority: f.artifactPriority });
  }

  {
    const f = c3Fact(answers);
    candidates.push({ id: "fact_c3_residence", dedupeGroup: "c3_residence", text: f.text, priority: f.artifactPriority });
  }

  if (!variables.supportAnswerUnknown) {
    const f = C4_FACT[answers.c4 as Exclude<C4Value, "unknown">];
    candidates.push({ id: "fact_c4_support", dedupeGroup: "c4_support", text: f.text, priority: f.artifactPriority });
  }

  if (!variables.wishesAnswerUnknown) {
    const f = C5_FACT[answers.c5 as Exclude<C5Value, "unknown">];
    candidates.push({ id: "fact_c5_wishes", dedupeGroup: "c5_wishes", text: f.text, priority: f.artifactPriority });
  }

  if (!variables.homeStatusAnswerUnknown) {
    const f = C6_FACT[answers.c6 as Exclude<C6Value, "unknown">];
    candidates.push({ id: "fact_c6_home_status", dedupeGroup: "c6_home_status", text: f.text, priority: f.artifactPriority });
  }

  if (!variables.moneyAnswerUnknown) {
    const f = C7_FACT[answers.c7 as Exclude<C7Value, "unknown">];
    candidates.push({ id: "fact_c7_money", dedupeGroup: "c7_money", text: f.text, priority: f.artifactPriority });
  }

  if (variables.homeIntentAnswered && answers.h1) {
    const f = H1_FACT[answers.h1];
    candidates.push({ id: "fact_h1_home_intent", dedupeGroup: "h1_home_intent", text: f.text, priority: f.artifactPriority });
  }

  if (variables.contractUnderstandingAnswered && !variables.contractAnswerUnknown && answers.ct1) {
    const f = CT1_FACT[answers.ct1 as Exclude<CT1Value, "unknown">];
    candidates.push({ id: "fact_ct1_contract", dedupeGroup: "ct1_contract", text: f.text, priority: f.artifactPriority });
  }

  const sorted = [...candidates].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return SOURCE_ORDER[a.dedupeGroup] - SOURCE_ORDER[b.dedupeGroup];
  });

  const deduped: ArtifactFactItem[] = [];
  const seenGroups = new Set<string>();
  for (const candidate of sorted) {
    if (seenGroups.has(candidate.dedupeGroup)) continue;
    seenGroups.add(candidate.dedupeGroup);
    deduped.push(candidate);
  }

  return deduped.slice(0, MAX_CONFIRMED_FACTS);
}
