import type { KnowledgeReasonId } from "./types";

/**
 * KnowledgeReasonIdから、利用者向け名称「whyNow」（今回なぜこのカードが表示されたか）の
 * 固定文への変換。回答値・Variablesは参照せず、発火条件も再判定しない（docs/03 第4章）。
 * Record<KnowledgeReasonId, string>により、TypeScriptの網羅性検査で11件すべての対応を
 * 強制する（未知のreasonIdを黙って空文字列にする、到達不能なdefaultで握りつぶす、といった
 * 実装を避けるため）。
 */
const WHY_NOW_TEXT: Record<KnowledgeReasonId, string> = {
  discharge_support_not_arranged: "退院後の生活サポートがまだ決まっていないため、必要なサポートがいつから始まるか確認する必要があります。",
  discharge_support_partly_arranged:
    "退院後の生活サポートにまだ決まっていない部分があるため、必要なサポートが途切れる期間がないか確認する必要があります。",
  discharge_residence_undecided: "退院後の住まいがまだ決まっていないため、必要なサポートをどこで、いつから受けるか確認する必要があります。",
  discharge_support_and_residence_gap:
    "退院後の住まいがまだ決まっておらず、生活サポートにも確認が必要な点が残っているため、退院後の生活に向けて、必要な準備を整理しておく必要があります。",
  money_family_contribution:
    "支払いがかさなる時期や、家族による費用負担がいつ必要になるかを早めに把握しておくことで、準備しやすくなります。",
  money_family_contribution_and_unclear:
    "今後の生活にかかる費用がまだ整理できていないため、支払いがかさなる時期と、家族による費用負担がいつ必要になるかをあわせて確認する必要があります。",
  money_family_contribution_urgent:
    "今後の生活にかかる費用を確認する必要があるため、支払いがかさなる時期や、家族による費用負担がいつ必要になるかを早めに整理しておきましょう。",
  home_ownership_unclear: "家の名義が確認できていないため、まず登記上の名義を確認する必要があります。",
  home_intent_unconfirmed: "本人の意向が確認できていないため、家のことを具体的に進める前に意向を確認する必要があります。",
  home_contract_concern: "契約に関して気になる点があるため、申込みや署名などを進める前に、内容を専門家へ確認する必要があります。",
  home_ownership_and_intent_unclear: "家の名義と本人の意向の両方が確認できていないため、家のことを具体的に進める前に確認する必要があります。",
};

export function getWhyNow(reasonId: KnowledgeReasonId): string {
  return WHY_NOW_TEXT[reasonId];
}
