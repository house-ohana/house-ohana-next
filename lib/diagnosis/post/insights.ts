import type { PostValidAnswers, PostInsightCard } from "./types";
import type { PostVariables } from "./variables";
import { INSIGHT_TEXT, CAPACITY_NAVI_LIMIT_NOTE, CAPACITY_ANSWER_ONLY_NOTE } from "./guidanceContent";

/**
 * 「⑤知っておくと詰まりにくいこと」（第13節）。最大3件。
 * 優先順: A(退院期限と支援) → H(支える人が少ない) → B/C/D(本人の契約理解・実家。3つは相互排他) →
 * G(家族の持ち出し) → F(住まなくなった後の税務上の期限) → E(空き家の管理)
 */
const MAX_INSIGHTS = 3;

export function buildInsights(answers: PostValidAnswers, v: PostVariables): PostInsightCard[] {
  const ordered: PostInsightCard[] = [];

  if ((v.isImmediateDeadline || v.isNearDeadline) && (v.supportUnclear || v.residenceUnclear)) {
    ordered.push({ id: "deadline_and_support", body: INSIGHT_TEXT.deadlineAndSupport });
  }

  if (v.supporterRisk) {
    ordered.push({ id: "few_supporters", body: INSIGHT_TEXT.fewSupporters });
  }

  // B/C/D: q9の値により相互排他（同時に真になることはない）
  if (v.contractConcern && v.homeActionExpected) {
    ordered.push({ id: "contract_concern_with_home", body: INSIGHT_TEXT.contractConcernWithHome, footnote: CAPACITY_NAVI_LIMIT_NOTE });
  } else if (v.contractStatusUnknown && v.homeActionExpected) {
    ordered.push({
      id: "contract_status_unknown_with_home",
      body: INSIGHT_TEXT.contractStatusUnknownWithHome,
      footnote: CAPACITY_ANSWER_ONLY_NOTE,
    });
  } else if (answers.q9 === "clearly_understands" && v.homeActionExpected) {
    ordered.push({ id: "contract_clear_with_home", body: INSIGHT_TEXT.contractClearWithHome });
  }

  if (v.familyContribution) {
    ordered.push({ id: "family_out_of_pocket", body: INSIGHT_TEXT.familyOutOfPocket });
  }

  if ((answers.q6 === "will_be_vacant" || answers.q6 === "already_vacant") && answers.q7 === "consider_home_income") {
    ordered.push({ id: "vacant_home_sale_deadline", body: INSIGHT_TEXT.vacantHomeSaleDeadline });
  }

  if (answers.q6 === "will_be_vacant" || answers.q6 === "already_vacant") {
    ordered.push({ id: "vacant_home_management", body: INSIGHT_TEXT.vacantHomeManagement });
  }

  return ordered.slice(0, MAX_INSIGHTS);
}
