import type { PostVariables } from "../variables";
import type { ArtifactFactItem } from "./types";

const MAX_UNKNOWN_ITEMS = 6;

type UnknownCandidateDef = {
  id: string;
  dedupeGroup: string;
  priority: number;
  text: string;
  condition: (variables: PostVariables) => boolean;
};

// 候補ごとの固定priority（回答値には依存しない）。confirmedFactsのartifactPriorityとは
// 独立した、unknownItems専用の表示順である。
const CANDIDATES: UnknownCandidateDef[] = [
  {
    id: "unknown_c2_deadline",
    dedupeGroup: "c2_deadline",
    priority: 10,
    text: "退院・入居の予定時期は、まだ確認できていません。",
    condition: (v) => v.deadlineAnswerUnknown,
  },
  {
    id: "unknown_c4_support",
    dedupeGroup: "c4_support",
    priority: 20,
    text: "退院後に必要な支援の内容は、まだ確認できていません。",
    condition: (v) => v.supportAnswerUnknown,
  },
  {
    id: "unknown_c5_wishes",
    dedupeGroup: "c5_wishes",
    priority: 30,
    text: "本人の希望は、まだ確認できていません。",
    condition: (v) => v.wishesAnswerUnknown,
  },
  {
    id: "unknown_c7_money",
    dedupeGroup: "c7_money",
    priority: 40,
    text: "費用の見通しは、まだ確認できていません。",
    condition: (v) => v.moneyAnswerUnknown,
  },
  {
    id: "unknown_s1_care",
    dedupeGroup: "s1_care",
    priority: 50,
    text: "要介護認定やケアマネジャーの状況は、まだ確認できていません。",
    condition: (v) => v.careAnswerUnknown,
  },
  {
    id: "unknown_c6_home_status",
    dedupeGroup: "c6_home_status",
    priority: 60,
    text: "ご本人の家が今後どうなるかは、まだ確認できていません。",
    condition: (v) => v.homeStatusAnswerUnknown,
  },
  {
    id: "unknown_h2_ownership",
    dedupeGroup: "h2_ownership",
    priority: 70,
    text: "ご本人の家の名義は、まだ確認できていません。",
    condition: (v) => v.ownershipUnclear,
  },
  {
    id: "unknown_ct1_contract",
    dedupeGroup: "ct1_contract",
    priority: 80,
    text: "契約内容について、ご本人が説明をどの程度理解し、考えを伝えられているかは、まだ確認できていません。",
    condition: (v) => v.contractAnswerUnknown,
  },
];

/**
 * 「まだ確認できていないこと」の候補を生成する。
 * variables.tsの確定フラグ（literalな"unknown"のみを表す）だけを条件に用い、
 * 候補ごとの固定priority昇順で並べ、dedupeGroupごとに1件へ絞った上で最大6件を返す。
 */
export function buildUnknownItems(variables: PostVariables): ArtifactFactItem[] {
  const applicable = CANDIDATES.filter((c) => c.condition(variables)).sort((a, b) => a.priority - b.priority);

  const deduped: ArtifactFactItem[] = [];
  const seenGroups = new Set<string>();
  for (const candidate of applicable) {
    if (seenGroups.has(candidate.dedupeGroup)) continue;
    seenGroups.add(candidate.dedupeGroup);
    deduped.push({ id: candidate.id, text: candidate.text, priority: candidate.priority, dedupeGroup: candidate.dedupeGroup });
  }

  return deduped.slice(0, MAX_UNKNOWN_ITEMS);
}
