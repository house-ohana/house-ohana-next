import type { KnowledgeReasonId } from "./types";

/**
 * KnowledgeReasonIdから、利用者向け名称「whyNow」（今回なぜこのカードが表示されたか）の
 * 固定文への変換。回答値・Variablesは参照せず、発火条件も再判定しない（docs/03 第4章）。
 * Record<KnowledgeReasonId, string>により、TypeScriptの網羅性検査で11件すべての対応を
 * 強制する（未知のreasonIdを黙って空文字列にする、到達不能なdefaultで握りつぶす、といった
 * 実装を避けるため）。
 */
const WHY_NOW_TEXT: Record<KnowledgeReasonId, string> = {
  discharge_support_not_arranged: "入院中で、退院後の支援がまだ決まっていないためです。",
  discharge_support_partly_arranged: "入院中で、退院後の支援に一部未調整が残っているためです。",
  discharge_residence_undecided: "入院中で、退院後に過ごす場所がまだ決まっていないためです。",
  discharge_support_and_residence_gap: "入院中で、退院後の住まいや支援に未調整が残っているためです。",
  money_family_contribution: "家族が費用を負担する可能性があると回答しているためです。",
  money_family_contribution_and_unclear: "家族が費用を負担する可能性があり、費用の見通しもまだ明確でないためです。",
  money_family_contribution_urgent: "家族が費用を負担する可能性があり、当面の支払い時期を早めに確認したい状況であるためです。",
  home_ownership_unclear: "家を動かす前に、登記上の名義がまだ確認できていないためです。",
  home_intent_unconfirmed: "家を動かす前の本人の理解・意向がまだ確認できていないためです。",
  home_contract_concern: "契約内容について、本人の理解を確認したい点があるためです。",
  home_ownership_and_intent_unclear: "家の名義と本人の理解・意向の両方に未確認があるためです。",
};

export function getWhyNow(reasonId: KnowledgeReasonId): string {
  return WHY_NOW_TEXT[reasonId];
}
