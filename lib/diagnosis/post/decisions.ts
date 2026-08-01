import type { PostValidAnswers } from "./types";
import type { PostVariables } from "./variables";

/**
 * 「④今決めること／後で決めてよいこと」（第12節）。
 */

const MAX_ITEMS = 3;

export type PostDecisions = {
  decideNow: string[];
  decideLater: string[];
  /** 後で決めてよいことのうち、期限や手続の有無だけ先に確認してほしい項目を含む場合に添える注記 */
  laterCaveat: boolean;
};

export function buildDecisions(answers: PostValidAnswers, v: PostVariables): PostDecisions {
  const decideNow: string[] = [];

  if (v.residenceUnclear && (v.isImmediateDeadline || v.isNearDeadline || v.hospitalizedSupportGap)) {
    decideNow.push("退院直後に過ごす場所の仮置き");
  }
  if ((v.supportUnclear || v.supportPartlyUnclear) && answers.q4 !== "not_needed_said") {
    decideNow.push("退院直後に必要な支援");
  }
  if (v.moneyNeedsEarlyCheck || v.moneyUnclear || v.familyContribution) {
    decideNow.push("当面3か月の費用");
  }
  if (v.supporterRisk) {
    decideNow.push("家族・周囲・公的窓口の担当分け");
  }
  if (v.homeWillRemain) {
    decideNow.push("空き家になる実家の最低限の管理担当");
  }
  if (v.homeActionExpected && (v.contractConcern || v.contractStatusUnknown)) {
    decideNow.push("契約前に確認する法律専門職");
  }

  const decideLater: string[] = [];
  let laterCaveat = false;

  if (answers.q3 === "temporary_home" || answers.q3 === "undecided") {
    decideLater.push("長期的にどこで暮らすか");
  }
  if (answers.q3 === "facility") {
    decideLater.push("施設等を長期の住まいとするか");
  }
  if (v.homeWillRemain || v.homeActionExpected) {
    decideLater.push("実家を最終的に残す・貸す・売るか");
    laterCaveat = true;
  }
  if (answers.q6 === "will_be_vacant" || answers.q6 === "already_vacant") {
    decideLater.push("家財をいつ、どこまで整理するか");
    laterCaveat = true;
  }
  if (v.homeWillRemain) {
    decideLater.push("実家の大規模な修繕を行うか");
    laterCaveat = true;
  }

  return {
    decideNow: decideNow.slice(0, MAX_ITEMS),
    decideLater: decideLater.slice(0, MAX_ITEMS),
    laterCaveat,
  };
}
