export type DiagnosisOption = {
  value: string;
  label: string;
};

export type DiagnosisQuestion = {
  id: string;
  title: string;
  hint?: string;
  multiple?: boolean;
  options: DiagnosisOption[];
};

// 質問ID -> 選択された選択肢のvalue配列（単一選択でも配列で保持する）
export type DiagnosisAnswers = Record<string, string[]>;

export type DiagnosisSummary = {
  now: string[];
  family: string[];
  professional: string[];
  later: string[];
};

// 結果画面の中心となる構造。「あなたの状況」「まず最初にすること」「今回整理すること（3区分）」
// 「そのまま使える質問」の4つに、既存の4つの視点（DiagnosisSummary）を補足として添える。
export type DiagnosisFirstAction = {
  headline: string; // 誰に／何を／いつまでに、を含む1文
  note?: string; // 補足（最大2行程度を想定。省略可）
};

// 結果画面の一番下「次の一歩」。まず最初にすることで名指しした相手とは重複させない。
export type DiagnosisNextStep = {
  contacts: string[]; // 追加で相談先になり得る外部の窓口（最大2件・該当なしなら空配列）
  showOhana: boolean; // 保険・実家・複数領域にまたがる等、House OHANAが該当する場合のみtrue
};

export type DiagnosisResult = {
  situation: string; // 1〜2文
  firstAction: DiagnosisFirstAction;
  familyDecisions: string[]; // 今、家族で決めること（最大3件）
  professionalDecisions: string[]; // 専門職に確認してから決めること（最大3件）
  laterDecisions: string[]; // 今は決めなくてよいこと（最大3件・該当なしなら空配列）
  readyQuestions: string[]; // そのまま使える質問（最大3件）
  perspectives: DiagnosisSummary; // 詳しく整理すると（既存の4つの視点、全体で最大8件）
  nextStep: DiagnosisNextStep; // 次の一歩（結果画面の一番下）
};
