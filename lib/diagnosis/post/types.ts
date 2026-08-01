// 「3分整理ナビ｜事後ブランチ」（m=post）の型定義。
// 仕様: House OHANA「3分整理ナビ」m=post枝 改修指示（実装最終版 / m-post-v2.1）が唯一の正本。

export type Q1Value = "hospitalized" | "discharged" | "facility_search" | "future";

export type ActiveStageQ2 = "within_7_days" | "within_30_days" | "date_unknown" | "no_deadline" | "unknown";

export type DischargedQ2 = "urgent_after_discharge" | "some_unresolved" | "mostly_settled" | "unknown";

export type Q3Value = "return_home" | "temporary_home" | "facility" | "undecided" | "other";

export type Q4Value = "arranged" | "partly_arranged" | "not_arranged" | "not_needed_said" | "unknown";

export type Q5Value = "wants_home" | "wants_facility" | "considering" | "not_discussed" | "hard_to_confirm" | "unknown";

export type Q6Value =
  | "person_returns"
  | "may_return"
  | "will_be_vacant"
  | "already_vacant"
  | "family_uses"
  | "no_home_issue"
  | "unknown";

export type Q7Value =
  | "likely_sufficient"
  | "unknown_amount"
  | "consider_home_income"
  | "family_pays"
  | "mixed"
  | "unknown";

export type Q8Value = "shared" | "mostly_one_person" | "few_supporters" | "unknown";

export type Q9Value = "clearly_understands" | "fluctuates" | "seems_difficult" | "not_confirmed" | "unknown";

export type PostQuestionId = "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8" | "q9";

// ウィザード進行中の回答（未回答のキーは持たない）。URLへ保存する前の作業用の型。
export type PostAnswers = Partial<Record<PostQuestionId, string>>;

// URLの復号に成功した後の、全問回答済み・整合性検証済みの回答。
// Q2はQ1の値によって許容される選択肢セットが変わるため string で保持し、
// 実際の絞り込みは lib/diagnosis/post/schema.ts の検証ロジックで行う。
export type PostValidAnswers = {
  q1: Q1Value;
  q2: ActiveStageQ2 | DischargedQ2;
  q3: Q3Value;
  q4: Q4Value;
  q5: Q5Value;
  q6: Q6Value;
  q7: Q7Value;
  q8: Q8Value;
  q9: Q9Value;
};

export type PostActionItem = {
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
