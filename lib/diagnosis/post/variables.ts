import type { PostValidAnswers } from "./types";

/**
 * 「3分整理ナビ｜事後ブランチ」（m=post）判定用の内部変数。
 * 実装最終版仕様書 第6節の擬似コードをそのまま実装したもの。
 * 生成AIやランダム処理は使わず、回答からの純粋関数として計算する。
 */
export type PostVariables = ReturnType<typeof computePostVariables>;

export function computePostVariables(answers: PostValidAnswers) {
  const { q1, q2, q3, q4, q5, q6, q7, q8, q9 } = answers;

  const isImmediateDeadline = q2 === "within_7_days" || q2 === "urgent_after_discharge";
  const isNearDeadline = q2 === "within_30_days" || q2 === "some_unresolved";

  const supportUnclear = q4 === "not_arranged" || q4 === "unknown";
  const supportPartlyUnclear = q4 === "partly_arranged";
  const residenceUnclear = q3 === "undecided";

  const wishesUnclear = q5 === "not_discussed" || q5 === "unknown";
  const wishesHardToConfirm = q5 === "hard_to_confirm";

  // 対象となる実家がない場合は、実家・空き家・売却・税務系を一律で抑止する
  const noHome = q6 === "no_home_issue";

  const homeWillRemain = !noHome && (q6 === "will_be_vacant" || q6 === "already_vacant" || q6 === "may_return");

  const homeActionExpected = !noHome && (q6 === "will_be_vacant" || q6 === "already_vacant" || q7 === "consider_home_income");

  const contractConcern = q9 === "fluctuates" || q9 === "seems_difficult";
  const contractStatusUnknown = q9 === "not_confirmed" || q9 === "unknown";

  const moneyUnclear = q7 === "unknown_amount" || q7 === "unknown";
  const familyContribution = q7 === "family_pays" || q7 === "mixed";

  const supporterRisk = q8 === "mostly_one_person" || q8 === "few_supporters";

  const atHomeDirection = q3 === "return_home" || q3 === "temporary_home";

  // 入院中で、退院日が未定でも、支援・住まいが未調整なら取りこぼさない
  const hospitalizedSupportGap = q1 === "hospitalized" && (supportUnclear || residenceUnclear);

  // 施設・住み替え先を探していて期限が未定でも、住まい・支援が未調整なら取りこぼさない
  const facilitySearchSupportGap = q1 === "facility_search" && (supportUnclear || residenceUnclear);

  const activeSupportGap = hospitalizedSupportGap || facilitySearchSupportGap;

  // 退院・入居期限が近く、費用不明または家族負担がある場合は、通常の資産整理より先に拾う
  const moneyNeedsEarlyCheck = (moneyUnclear || familyContribution) && (isImmediateDeadline || isNearDeadline || activeSupportGap);

  const moneyCheckDeadline: "今日" | "3日以内" = isImmediateDeadline ? "今日" : "3日以内";

  const needsRegionalSupport =
    (q1 === "discharged" && (supportUnclear || supportPartlyUnclear || residenceUnclear)) || facilitySearchSupportGap || supporterRisk;

  const homeFinancePlanning = !noHome && q7 === "consider_home_income";

  return {
    isImmediateDeadline,
    isNearDeadline,
    supportUnclear,
    supportPartlyUnclear,
    residenceUnclear,
    wishesUnclear,
    wishesHardToConfirm,
    noHome,
    homeWillRemain,
    homeActionExpected,
    contractConcern,
    contractStatusUnknown,
    moneyUnclear,
    familyContribution,
    supporterRisk,
    atHomeDirection,
    hospitalizedSupportGap,
    facilitySearchSupportGap,
    activeSupportGap,
    moneyNeedsEarlyCheck,
    moneyCheckDeadline,
    needsRegionalSupport,
    homeFinancePlanning,
  };
}
