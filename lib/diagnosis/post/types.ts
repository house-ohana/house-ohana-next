// 「3分整理ナビ｜事後ブランチ」（m=post）の型定義。
// 仕様: docs/phase2-design.md（Phase2 質問構造再設計・承認済み）が唯一の正本。
// 質問構造の詳細は lib/diagnosis/post/questions.ts を参照。

// ---- 共通質問（C1〜C8） ----

export type C1Value = "hospitalized" | "discharged" | "facility_search" | "future";

export type ActiveStageC2 = "within_7_days" | "within_30_days" | "date_unknown" | "no_deadline" | "unknown";

export type DischargedC2 = "urgent_after_discharge" | "some_unresolved" | "mostly_settled" | "unknown";

export type C3Value = "return_home" | "temporary_home" | "facility" | "undecided" | "other";

export type C4Value = "arranged" | "partly_arranged" | "not_arranged" | "not_needed_said" | "unknown";

export type C5Value = "wants_home" | "wants_facility" | "considering" | "not_discussed" | "hard_to_confirm" | "unknown";

export type C6Value =
  | "person_returns"
  | "may_return"
  | "will_be_vacant"
  | "already_vacant"
  | "family_uses"
  | "no_home_issue"
  | "unknown";

// 実家を売る・貸す意向（consider_home_income相当）はH1（実家枝）へ分離したため、ここには含めない。
export type C7Value = "likely_sufficient" | "unknown_amount" | "family_pays" | "mixed" | "unknown";

export type C8Value = "shared" | "mostly_one_person" | "few_supporters" | "unknown";

// ---- 条件付き追加質問（該当者のみ） ----

// 支援枝（ゲート: C4が「一部決まっている／まだ決まっていない／分からない」）
// 「申請中」と「まだ申請していない」は別の状態のため分離する（docs/phase2-design.md 再修正版①）。
export type S1Value = "certified_with_manager" | "certified_no_manager" | "applying" | "not_applied" | "unknown";

// 実家枝（ゲート: C6が「対象になる実家はない」「分からない」以外）
export type H1Value = "sell" | "rent" | "demolish" | "keep_for_now" | "undecided";

// 実家枝の続き（ゲート: H1が売る・貸す・解体のいずれか）
// 「本人以外の名義」（本人に持分がない）は、共有名義とは別の状態のため分離する（同文書②）。
export type H2Value = "sole_owner" | "shared_owner" | "other_owner" | "unknown";

// 契約枝（ゲート: H1が売る・貸す・解体のいずれか）。質問文はH1の値に応じて売却／賃貸／解体の
// 手続に限定する（同文書③）。回答の選択肢自体は現行のまま。
export type CT1Value = "clearly_understands" | "fluctuates" | "seems_difficult" | "not_confirmed" | "unknown";

export type PostCommonQuestionId = "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c7" | "c8";
export type PostBranchQuestionId = "s1" | "h1" | "h2" | "ct1";
export type PostQuestionId = PostCommonQuestionId | PostBranchQuestionId;

// ウィザード進行中の回答（未回答のキーは持たない）。URLへ保存する前の作業用の型。
export type PostAnswers = Partial<Record<PostQuestionId, string>>;

// URLの復号に成功した後の回答。共通質問（C1〜C8）は必須、条件付き質問（S1/H1/H2/CT1）は
// 該当する場合のみ存在する。該当しないのに値がある／該当するのに値がない場合はデコード時点で
// 不正として扱う（lib/diagnosis/post/schema.ts）。
export type PostValidAnswers = {
  c1: C1Value;
  c2: ActiveStageC2 | DischargedC2;
  c3: C3Value;
  c4: C4Value;
  c5: C5Value;
  c6: C6Value;
  c7: C7Value;
  c8: C8Value;
  s1?: S1Value;
  h1?: H1Value;
  h2?: H2Value;
  ct1?: CT1Value;
};

// ---- 結果表示（Phase1.5で確定した構造。Phase2では変更しない） ----

export type PostActionItem = {
  /** actions.ts の ActionCandidate.id をそのまま渡す。選択ロジックには影響しない、表示専用の識別子。 */
  id: string;
  headline: string;
  note?: string;
};

export type PostSecondaryAction = {
  deadline: string;
  contact: string;
  title: string;
};

export type PostContactCard = {
  id: string;
  name: string;
  note?: string;
  questions: string[];
};

export type PostInsightCard = {
  id: string;
  body: string;
  footnote?: string;
};

export type PostConsultationSection = {
  urgent: boolean;
  homeAndContract: boolean;
};

export type PostResult = {
  schemaVersion: string;
  situation: string;
  firstAction: PostActionItem;
  nextActions: PostSecondaryAction[];
  decideNow: string[];
  decideLater: string[];
  decideLaterCaveat: boolean;
  insights: PostInsightCard[];
  contacts: PostContactCard[];
  selfHelp: string[];
  askProfessional: string[];
  consultation: PostConsultationSection;
};
