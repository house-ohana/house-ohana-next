// Phase4.1「見落としやすい崖」知識カードの型定義。
// 仕様: docs/03-phase4-knowledge-cards.md v1.2（第4章）／
// docs/instructions/phase4.1-minimum-knowledge-cards.md（第4章）。
//
// Step1（content.ts・contentVerification.ts・registry.ts・reasons.ts）では型定義・固定
// content・reasons・registryを実装した。Step2（matchers.ts・selector.ts）でKnowledgeCardMatch
// を実際に生成し、selectorがPostKnowledgeCardを組み立てる。PostResultへの接続・UIへの接続は
// まだ実装しない。

export type KnowledgeCardId = "discharge_support_start_gap" | "transition_monthly_cash_gap" | "home_ownership_intent_gap";

/** 3カードの固定順。集約（matchKnowledgeCards）の返却順、selectorの同順位tie-breakで使用する。 */
export const KNOWLEDGE_CARD_ORDER: readonly KnowledgeCardId[] = [
  "discharge_support_start_gap",
  "transition_monthly_cash_gap",
  "home_ownership_intent_gap",
];

export type KnowledgeReasonId =
  // Card A（discharge_support_start_gap）
  | "discharge_support_not_arranged"
  | "discharge_support_partly_arranged"
  | "discharge_residence_undecided"
  | "discharge_support_and_residence_gap"
  // Card B（transition_monthly_cash_gap）
  | "money_family_contribution"
  | "money_family_contribution_and_unclear"
  | "money_family_contribution_urgent"
  // Card C（home_ownership_intent_gap）
  | "home_ownership_unclear"
  | "home_intent_unconfirmed"
  | "home_contract_concern"
  | "home_ownership_and_intent_unclear";

export type KnowledgeUrgency = "high" | "medium";

/**
 * lib/diagnosis/post/guidanceContent.ts の CONTACT_CARDS には、対応するID用の
 * Union型がexportされていない（PostContactCard.idはstring型）。Step1ではcontacts側を
 * 変更せず、knowledgeCards側にこの最小限のUnion型を独自定義する。
 * 将来、contacts側にID用のUnion型がexportされた場合は、そちらへ統合することを検討する
 * （完了報告に記載。CONTACT_CARDSの実際のid値: hospital/care_manager/regional_support/
 * legal/real_estate/tax/fp）。
 */
export type ExistingContactId = "hospital" | "care_manager" | "regional_support" | "legal" | "real_estate" | "tax" | "fp";

export type KnowledgeSource = {
  readonly title: string;
  readonly organization: string;
  readonly url: string;
  readonly accessedAt: string;
};

/**
 * カード本文（content）。表示条件・reasonId・rank・urgency・enabled・whyNow・action・
 * contact・questionToAskは持たない（docs/03 第4章）。
 * 出典未確認の状態は、sources: [] / verifiedAt: null / reviewBy: null で明示する
 * （空文字列・架空URL・仮の日付・"PENDING"等のダミー値は使用しない）。
 */
export type KnowledgeCardContent = {
  readonly id: KnowledgeCardId;
  readonly title: string;
  readonly cliff: string;
  readonly checkItems: readonly string[];
  readonly linkedContactIds: readonly ExistingContactId[];
  readonly sources: readonly KnowledgeSource[];
  readonly verifiedAt: string | null;
  readonly reviewBy: string | null;
};

/**
 * content本体とは別に管理する運用メタデータ。enabledはここに置き、contentへ混在させない。
 * enabledは回答によって変化せず、matcherが決めるものでもなく、UIが独自に判定するものでも
 * ない（docs/03 第4章）。
 */
export type KnowledgeCardRegistryEntry = {
  readonly content: KnowledgeCardContent;
  readonly enabled: boolean;
};

/**
 * matcher結果の型。判別可能Union（discriminated union）とし、matched=falseに
 * reasonId／rank／urgencyの架空値を持たせない（cardIdのみ）。matched=trueのときだけ
 * reasonId／rank／urgencyを持つ。
 */
export type KnowledgeCardMatch =
  | {
      readonly matched: false;
      readonly cardId: KnowledgeCardId;
    }
  | {
      readonly matched: true;
      readonly cardId: KnowledgeCardId;
      readonly reasonId: KnowledgeReasonId;
      readonly rank: number;
      readonly urgency: KnowledgeUrgency;
    };

/**
 * 画面表示用の型。PostResultへの接続・UIへの接続はStep2でもまだ行わない。
 * verifiedAt／reviewByは、元となるKnowledgeCardContentと同じく`string | null`とする
 * （selectorはcontent readinessを再判定しないため、content側がnullのまま渡ってくる
 * 可能性を型として正直に表す。enabled=trueにする運用上の前提はStep5のisContentReadyToEnable
 * が別途担保する）。
 */
export type PostKnowledgeCard = {
  readonly id: KnowledgeCardId;
  readonly title: string;
  readonly cliff: string;
  readonly whyNow: string;
  readonly checkItems: readonly string[];
  readonly linkedContactIds: readonly ExistingContactId[];
  readonly sources: readonly KnowledgeSource[];
  readonly verifiedAt: string | null;
  readonly reviewBy: string | null;
  readonly rank: number;
  readonly urgency: KnowledgeUrgency;
};
