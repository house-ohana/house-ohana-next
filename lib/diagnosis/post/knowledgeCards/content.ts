import type { KnowledgeCardContent } from "./types";

/**
 * Phase4.1「見落としやすい崖」3カードの固定content。
 * 表示条件・reasonId・rank・urgency・enabledは持たない（docs/03 第4章）。
 * 出典URL・確認日を推測で作らないため、Step1時点ではsources/verifiedAt/reviewByを
 * すべて未確認状態（[] / null / null）とする（docs/instructions 第4章）。
 */

export const DISCHARGE_SUPPORT_START_GAP: KnowledgeCardContent = {
  id: "discharge_support_start_gap",
  title: "退院後の支援は、退院日と同じ日に始まるとは限りません",
  cliff:
    "退院後に必要な移動、見守り、医療・介護・生活支援が、退院当日からすべて始まるとは限りません。最初の数日に支援の空白がないかを、退院前に確認します。",
  checkItems: [
    "退院当日の移動手段",
    "退院当日から最初の数日を誰が支えるか",
    "医療・介護・生活支援が始まる日",
    "まだ決まっていない事項の担当者と確認期限",
  ],
  linkedContactIds: ["hospital", "regional_support", "care_manager"],
  sources: [],
  verifiedAt: null,
  reviewBy: null,
};

export const TRANSITION_MONTHLY_CASH_GAP: KnowledgeCardContent = {
  id: "transition_monthly_cash_gap",
  title: "費用の総額だけでは、家族が負担する時期までは分かりません",
  cliff:
    "家族が費用を負担する可能性がある場合でも、総額だけでは、支払いが重なる月や家族の立替えが始まる時期までは分かりません。今後3か月を月ごとに分けて確認します。",
  checkItems: ["毎月入るお金", "毎月続く支出", "その月だけ発生する支出", "家族が支払う予定の費用と開始月"],
  linkedContactIds: ["fp"],
  sources: [],
  verifiedAt: null,
  reviewBy: null,
};

export const HOME_OWNERSHIP_INTENT_GAP: KnowledgeCardContent = {
  id: "home_ownership_intent_gap",
  title: "家の方針が決まっても、名義と本人の意向が揃っているとは限りません",
  cliff:
    "売却・賃貸・解体などの方向が決まっていても、名義、共有者、本人の理解・意向など、手続きの前提となる確認事項が残っている可能性があります。",
  checkItems: ["登記上の名義", "共有名義の場合の共有者", "本人へ説明した内容と本人の意向", "契約前に確認する専門家"],
  linkedContactIds: ["legal"],
  sources: [],
  verifiedAt: null,
  reviewBy: null,
};

export const KNOWLEDGE_CARD_CONTENTS: readonly KnowledgeCardContent[] = [
  DISCHARGE_SUPPORT_START_GAP,
  TRANSITION_MONTHLY_CASH_GAP,
  HOME_OWNERSHIP_INTENT_GAP,
];
