import type { PostValidAnswers } from "./types";
import type { PostVariables } from "./variables";

/**
 * 「⑦自分たちでできること／専門家に確認すること」（第15節）。それぞれ最大3件。
 */
const MAX_ITEMS = 3;

export function buildSelfHelp(answers: PostValidAnswers, v: PostVariables): string[] {
  const items: string[] = [];

  const hospitalDischargeCheck = answers.c1 === "hospitalized" && (v.isImmediateDeadline || v.isNearDeadline || v.activeSupportGap);
  if (hospitalDischargeCheck) {
    items.push("病院へ退院予定日・未決定事項を確認する");
  }
  // 1と2は同じ内容になるため、1が該当する場合は2を重ねて出さない
  if (!hospitalDischargeCheck && (v.supportUnclear || v.supportPartlyUnclear || v.residenceUnclear)) {
    items.push("決まっていることと未決定のことを分ける");
  }

  if (v.wishesUnclear || v.wishesHardToConfirm || answers.c5 === "considering") {
    items.push("本人の希望を確認する。すでに確認済みなら文章に残す");
  }

  const moneyChecklist = v.moneyUnclear || v.familyContribution || v.homeFinancePlanning;
  if (moneyChecklist) {
    items.push("3か月分の費用を一覧化し、加入済み保険の給付条件を確認する");
  }

  if (v.supporterRisk) {
    items.push("家族や周囲の担当を分ける");
  }

  // 4と6は同じ内容になるため、4が該当する場合は6を重ねて出さない
  if (!moneyChecklist && v.familyContribution) {
    items.push("家族が支払った費用を記録する");
  }

  if (v.homeWillRemain) {
    items.push("実家の鍵、郵便物、換気、通水、庭の担当を決める");
  }

  if (v.homeActionExpected) {
    items.push("建物・土地の名義など、専門家へ見せる資料を確認する");
  }

  return items.slice(0, MAX_ITEMS);
}

export function buildAskProfessional(answers: PostValidAnswers, v: PostVariables): string[] {
  const items: string[] = [];

  if (v.supportUnclear || v.supportPartlyUnclear || v.residenceUnclear || v.atHomeDirection) {
    items.push("退院後に必要な医療・介護支援");
  }

  if (v.contractConcern) {
    items.push("医師等に確認できる認知機能・意思疎通の現在の状態");
  }

  if (v.homeActionExpected && (v.contractConcern || v.contractStatusUnknown)) {
    items.push("契約を誰がどの手続で進められるかという法律上の手続");
  }

  if (v.moneyUnclear || v.familyContribution || v.homeFinancePlanning) {
    items.push("資金が何年続くかの試算");
  }

  if (v.homeActionExpected || v.homeWillRemain) {
    items.push("売却・賃貸・管理の価格と実務");
  }

  if (v.homeFinancePlanning || answers.c6 === "will_be_vacant" || answers.c6 === "already_vacant") {
    items.push("税制上の期限と条件");
  }

  return items.slice(0, MAX_ITEMS);
}
