import type { DiagnosisAnswers } from "./types";

/**
 * 「3分整理ナビ」の回答をURLクエリへ変換するためのスキーマ定義。
 *
 * 設計方針:
 * - URLには氏名・連絡先・自由記述などを含めず、選択式回答を表す短い英字コードのみを含める。
 * - v=1 のように診断仕様のバージョンを持たせ、将来質問構成を変えるときはバージョンを上げる。
 * - 過去に発行されたURL（ブックマーク・共有リンク）を将来も復号できるよう、
 *   一度公開したバージョンの質問ID・選択肢の並び（コード表）は変更しない。
 *   質問や選択肢を変える場合は、DIAGNOSIS_CURRENT_VERSION を上げ、
 *   新しいバージョンのフィールド定義を追加すること（既存の V1_FIELDS は編集しない）。
 * - このファイルは lib/diagnosis/questions.ts を参照せず、値を直接書き写している。
 *   questions.ts 側の質問文・選択肢を自由に編集しても、既存バージョンの復号結果には影響しない。
 */

type DiagnosisField = {
  questionId: string;
  param: string;
  multiple: boolean;
  // 配列のindex位置がそのままURL上の1文字コード（a, b, c, ...）になる
  values: readonly string[];
};

const CODE_LETTERS = "abcdefghijklmnopqrstuvwxyz";

// v1: lib/diagnosis/questions.ts の質問・選択肢と対応するコード表
const V1_FIELDS: readonly DiagnosisField[] = [
  {
    questionId: "location",
    param: "q1",
    multiple: false,
    values: ["home", "hospital", "facility", "relative", "other"],
  },
  {
    questionId: "deadline",
    param: "q2",
    multiple: false,
    values: ["within_week", "within_month", "within_3months", "undecided", "not_applicable"],
  },
  {
    questionId: "wish_confirmed",
    param: "q3",
    multiple: false,
    values: ["clear", "somewhat", "differs", "not_yet", "difficult"],
  },
  {
    questionId: "family_agreement",
    param: "q4",
    multiple: false,
    values: ["mostly", "partial_diff", "major_diff", "not_discussed"],
  },
  {
    questionId: "concerns",
    param: "q5",
    multiple: true,
    values: [
      "after_discharge",
      "home_life",
      "facility",
      "cost",
      "home_management",
      "home_future",
      "family_roles",
      "who_to_ask",
      "other",
    ],
  },
  {
    questionId: "vacant_home",
    param: "q6",
    multiple: false,
    values: ["already_vacant", "soon_vacant", "may_return", "family_may_use", "unknown", "not_applicable"],
  },
  {
    questionId: "professionals_involved",
    param: "q7",
    multiple: true,
    values: [
      "hospital_staff",
      "care_manager",
      "community_center",
      "facility_staff",
      "specialist",
      "real_estate",
      "none",
      "other",
    ],
  },
  {
    questionId: "want_to_know",
    param: "q8",
    multiple: false,
    values: ["now", "family_talk", "ask_professional", "home_order", "cost_items", "where_to_ask"],
  },
];

const SCHEMA_BY_VERSION: Record<number, readonly DiagnosisField[]> = {
  1: V1_FIELDS,
};

export const DIAGNOSIS_CURRENT_VERSION = 1;
export const DIAGNOSIS_RESULT_PATH = "/diagnosis/result";

// 1問あたりの最大選択肢数より十分大きい上限（不正に長いクエリ値を弾くためのガード）
const MAX_FIELD_VALUE_LENGTH = 20;

export type DiagnosisSearchParams = Record<string, string | string[] | undefined>;

export type DiagnosisDecodeResult =
  | { ok: true; version: number; answers: DiagnosisAnswers }
  | { ok: false; reason: "missing_version" | "unsupported_version" | "incomplete" };

function firstParamValue(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

function codeForValue(field: DiagnosisField, value: string): string | undefined {
  const index = field.values.indexOf(value);
  return index === -1 ? undefined : CODE_LETTERS[index];
}

function valueForCode(field: DiagnosisField, code: string): string | undefined {
  const index = CODE_LETTERS.indexOf(code);
  if (index === -1 || index >= field.values.length) return undefined;
  return field.values[index];
}

export function encodeDiagnosisAnswers(
  answers: DiagnosisAnswers,
  version: number = DIAGNOSIS_CURRENT_VERSION,
): string {
  const fields = SCHEMA_BY_VERSION[version];
  if (!fields) throw new Error(`Unknown diagnosis schema version: ${version}`);

  const params = new URLSearchParams();
  params.set("v", String(version));

  for (const field of fields) {
    const selected = answers[field.questionId] ?? [];
    const codes = selected.map((value) => codeForValue(field, value)).filter((code): code is string => Boolean(code));
    if (codes.length > 0) {
      params.set(field.param, codes.join(""));
    }
  }

  return params.toString();
}

export function buildDiagnosisResultPath(
  answers: DiagnosisAnswers,
  version: number = DIAGNOSIS_CURRENT_VERSION,
): string {
  return `${DIAGNOSIS_RESULT_PATH}?${encodeDiagnosisAnswers(answers, version)}`;
}

export function decodeDiagnosisParams(rawParams: DiagnosisSearchParams): DiagnosisDecodeResult {
  const rawVersion = firstParamValue(rawParams.v);
  if (!rawVersion) return { ok: false, reason: "missing_version" };

  const version = Number(rawVersion);
  if (!Number.isInteger(version) || version < 1) {
    return { ok: false, reason: "unsupported_version" };
  }

  const fields = SCHEMA_BY_VERSION[version];
  if (!fields) return { ok: false, reason: "unsupported_version" };

  const answers: DiagnosisAnswers = {};

  for (const field of fields) {
    const raw = firstParamValue(rawParams[field.param]);
    if (!raw || raw.length > MAX_FIELD_VALUE_LENGTH) {
      return { ok: false, reason: "incomplete" };
    }

    const codes = Array.from(new Set(raw.split("")));
    if (!field.multiple && codes.length !== 1) {
      return { ok: false, reason: "incomplete" };
    }

    const values: string[] = [];
    for (const code of codes) {
      const value = valueForCode(field, code);
      if (!value) return { ok: false, reason: "incomplete" };
      values.push(value);
    }

    answers[field.questionId] = values;
  }

  return { ok: true, version, answers };
}

/**
 * 他ページ（お問い合わせページなど）へ診断結果URLを引き継ぐ際の検証関数。
 * "/diagnosis/result?..." という形の相対パスで、かつ実際に復号可能な内容のときだけ
 * 正規化したパスを返す。外部URLへのオープンリダイレクトや任意文字列の受け渡しを防ぐため、
 * それ以外の入力はすべて null を返す。
 */
export function parseDiagnosisResultPath(raw: string | undefined | null): string | null {
  if (!raw || raw.length > 300) return null;
  if (!raw.startsWith(`${DIAGNOSIS_RESULT_PATH}?`)) return null;

  let url: URL;
  try {
    url = new URL(raw, "https://placeholder.invalid");
  } catch {
    return null;
  }

  if (url.pathname !== DIAGNOSIS_RESULT_PATH) return null;

  const params: DiagnosisSearchParams = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const decoded = decodeDiagnosisParams(params);
  if (!decoded.ok) return null;

  return buildDiagnosisResultPath(decoded.answers, decoded.version);
}
