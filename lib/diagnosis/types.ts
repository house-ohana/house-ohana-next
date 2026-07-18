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
