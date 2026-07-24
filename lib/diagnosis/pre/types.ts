// 「3分整理ナビ｜平時ブランチ」（m=pre）の型定義。
// 仕様: docs/navi-result-mapping.md（v4・最終版）が唯一の正本。

export type PreQuestionId =
  | "Q1"
  | "Q2"
  | "T1"
  | "Q3"
  | "Q4"
  | "T2"
  | "Q5"
  | "Q6"
  | "T3"
  | "Q7"
  | "Q8"
  | "T4"
  | "Q9"
  | "Q10"
  | "T5";

export type PreWho = "self" | "family";

// 質問ID -> 選択された1文字コード（a〜e）。単一選択のみ。
// T1・T4は前の回答によって非該当のときキー自体を持たない。
export type PreAnswers = Partial<Record<PreQuestionId, string>>;

export type PreCategory = "A" | "B";

export type PreResultItem = {
  category: PreCategory;
  fact: string;
  point?: string;
  area?: string;
  priority?: number;
};

export type PreResult = {
  who: PreWho;
  /** 身近に頼れる方がいない場合のみの冒頭案内文。該当しない場合はnull */
  banner: string | null;
  /** 身近に頼れる方がいない場合のみ「支援機関の方に」。それ以外は「ご家族や信頼できる方に」 */
  shareAudienceLabel: string;
  a: string[];
  bTop3: PreResultItem[];
  bRest: PreResultItem[];
};
