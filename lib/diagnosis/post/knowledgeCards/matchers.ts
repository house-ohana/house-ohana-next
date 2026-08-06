import type { PostValidAnswers } from "../types";
import type { PostVariables } from "../variables";
import type { KnowledgeCardId, KnowledgeCardMatch, KnowledgeReasonId } from "./types";
import { KNOWLEDGE_CARD_ORDER } from "./types";

/**
 * Phase4.1「見落としやすい崖」3カードのmatcher。
 * 完全決定論。1カードにつきKnowledgeCardMatchを1件返し、matched=trueのreasonIdは
 * 常に1件だけ。content本文・whyNow本文・registry・enabledは参照しない。
 * 既存のPostVariables（variables.ts）を優先し、生の回答値から新しい複雑な複合判定は
 * 再構築しない。Card Aの現在地確認（answers.c1）に限り、単一回答値を直接参照する。
 */

// ---- Card A: discharge_support_start_gap ----

function resolveDischargeReasonId(v: PostVariables): KnowledgeReasonId {
  if (v.residenceUnclear && (v.supportUnclear || v.supportPartlyUnclear)) return "discharge_support_and_residence_gap";
  if (v.supportUnclear) return "discharge_support_not_arranged";
  if (v.supportPartlyUnclear) return "discharge_support_partly_arranged";
  return "discharge_residence_undecided";
}

export function matchDischargeSupportStartGap(answers: PostValidAnswers, v: PostVariables): KnowledgeCardMatch {
  const cardId: KnowledgeCardId = "discharge_support_start_gap";
  const eligible = answers.c1 === "hospitalized" && (v.supportUnclear || v.supportPartlyUnclear || v.residenceUnclear);
  if (!eligible) {
    return { matched: false, cardId };
  }
  return {
    matched: true,
    cardId,
    reasonId: resolveDischargeReasonId(v),
    rank: 10,
    urgency: v.isImmediateDeadline ? "high" : "medium",
  };
}

// ---- Card B: transition_monthly_cash_gap ----

function resolveMoneyReasonId(v: PostVariables): KnowledgeReasonId {
  if (v.moneyNeedsEarlyCheck) return "money_family_contribution_urgent";
  if (v.moneyUnclear) return "money_family_contribution_and_unclear";
  return "money_family_contribution";
}

export function matchTransitionMonthlyCashGap(v: PostVariables): KnowledgeCardMatch {
  const cardId: KnowledgeCardId = "transition_monthly_cash_gap";
  if (!v.familyContribution) {
    return { matched: false, cardId };
  }
  return {
    matched: true,
    cardId,
    reasonId: resolveMoneyReasonId(v),
    rank: v.moneyNeedsEarlyCheck ? 15 : 30,
    urgency: v.moneyNeedsEarlyCheck ? "high" : "medium",
  };
}

// ---- Card C: home_ownership_intent_gap ----

function resolveHomeReasonId(v: PostVariables): KnowledgeReasonId {
  if (v.contractConcern) return "home_contract_concern";
  if (v.ownershipUnclear && v.contractStatusUnknown) return "home_ownership_and_intent_unclear";
  if (v.ownershipUnclear) return "home_ownership_unclear";
  return "home_intent_unconfirmed";
}

export function matchHomeOwnershipIntentGap(v: PostVariables): KnowledgeCardMatch {
  const cardId: KnowledgeCardId = "home_ownership_intent_gap";
  const eligible = v.homeActionExpected && (v.ownershipUnclear || v.contractStatusUnknown || v.contractConcern);
  if (!eligible) {
    return { matched: false, cardId };
  }
  return {
    matched: true,
    cardId,
    reasonId: resolveHomeReasonId(v),
    rank: 20,
    urgency: v.contractConcern ? "high" : "medium",
  };
}

// ---- 集約 ----

/**
 * 3つのmatcherを固定順（KNOWLEDGE_CARD_ORDER）で実行し、常に3件のKnowledgeCardMatchを
 * 返す（matched=falseを含む）。selector処理（enabled確認・rank sort・最大件数制限・
 * contentとの結合）は行わない。
 */
export function matchKnowledgeCards(answers: PostValidAnswers, v: PostVariables): readonly KnowledgeCardMatch[] {
  const byCardId: Record<KnowledgeCardId, KnowledgeCardMatch> = {
    discharge_support_start_gap: matchDischargeSupportStartGap(answers, v),
    transition_monthly_cash_gap: matchTransitionMonthlyCashGap(v),
    home_ownership_intent_gap: matchHomeOwnershipIntentGap(v),
  };
  return KNOWLEDGE_CARD_ORDER.map((cardId) => byCardId[cardId]);
}
