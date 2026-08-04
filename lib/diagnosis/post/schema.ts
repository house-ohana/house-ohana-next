import type { PostValidAnswers, PostQuestionId } from "./types";

/**
 * 「3分整理ナビ｜事後ブランチ」（m=post）のURLクエリ仕様（m-post-v2.1）。
 *
 * 設計方針:
 * - URLには氏名・住所・病名・資産額などを含めず、質問IDに対応する短い英数字IDのみを含める。
 * - v には固定文字列 "m-post-v2.1" を入れる（旧実装の数値バージョンとは別空間）。
 *   これにより、旧m=post URL（数値v・8問構成）は自動的に unsupported_version として
 *   検出され、推測変換せずに安全に案内画面へ戻せる。
 * - Q1=future の回答は結果URLとして生成・受理しない（案内画面はウィザード内で完結する）。
 * - Q2はQ1の値によって許容集合が変わる。Q7の consider_home_income はQ6=no_home_issueの
 *   ときには成立しない。これらの不整合は推測で補正せず、デコード失敗として扱う。
 */

export const POST_SCHEMA_VERSION = "m-post-v2.1";
export const POST_RESULT_PATH = "/diagnosis/result";

const ACTIVE_Q2_VALUES = ["within_7_days", "within_30_days", "date_unknown", "no_deadline", "unknown"] as const;
const DISCHARGED_Q2_VALUES = ["urgent_after_discharge", "some_unresolved", "mostly_settled", "unknown"] as const;

const ALLOWED_VALUES: Record<Exclude<PostQuestionId, "q2">, readonly string[]> = {
  q1: ["hospitalized", "discharged", "facility_search", "future"],
  q3: ["return_home", "temporary_home", "facility", "undecided", "other"],
  q4: ["arranged", "partly_arranged", "not_arranged", "not_needed_said", "unknown"],
  q5: ["wants_home", "wants_facility", "considering", "not_discussed", "hard_to_confirm", "unknown"],
  q6: ["person_returns", "may_return", "will_be_vacant", "already_vacant", "family_uses", "no_home_issue", "unknown"],
  q7: ["likely_sufficient", "unknown_amount", "consider_home_income", "family_pays", "mixed", "unknown"],
  q8: ["shared", "mostly_one_person", "few_supporters", "unknown"],
  q9: ["clearly_understands", "fluctuates", "seems_difficult", "not_confirmed", "unknown"],
};

const QUESTION_ORDER: PostQuestionId[] = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"];

const MAX_FIELD_VALUE_LENGTH = 40;

export type PostSearchParams = Record<string, string | string[] | undefined>;

export type PostDecodeFailureReason =
  | "missing_version"
  | "unsupported_version"
  | "incomplete"
  | "stage_mismatch"
  | "home_contradiction"
  | "future_not_supported"
  | "invalid_mode";

export type PostDecodeResult = { ok: true; answers: PostValidAnswers } | { ok: false; reason: PostDecodeFailureReason };

function firstParamValue(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

function allowedQ2Values(q1: string): readonly string[] {
  return q1 === "discharged" ? DISCHARGED_Q2_VALUES : ACTIVE_Q2_VALUES;
}

export function encodePostAnswers(answers: PostValidAnswers): string {
  const params = new URLSearchParams();
  params.set("m", "post");
  params.set("v", POST_SCHEMA_VERSION);
  for (const id of QUESTION_ORDER) {
    params.set(id, answers[id]);
  }
  return params.toString();
}

export function buildPostResultPath(answers: PostValidAnswers): string {
  return `${POST_RESULT_PATH}?${encodePostAnswers(answers)}`;
}

export function decodePostParams(rawParams: PostSearchParams): PostDecodeResult {
  const rawVersion = firstParamValue(rawParams.v);
  if (!rawVersion) return { ok: false, reason: "missing_version" };
  if (rawVersion !== POST_SCHEMA_VERSION) return { ok: false, reason: "unsupported_version" };

  const rawQ1 = firstParamValue(rawParams.q1);
  if (!rawQ1 || rawQ1.length > MAX_FIELD_VALUE_LENGTH || !ALLOWED_VALUES.q1.includes(rawQ1)) {
    return { ok: false, reason: "incomplete" };
  }
  if (rawQ1 === "future") {
    // futureは結果URLとして成立しない（ウィザード内の案内画面のみで完結する）
    return { ok: false, reason: "future_not_supported" };
  }

  const rawQ2 = firstParamValue(rawParams.q2);
  const q2Allowed = allowedQ2Values(rawQ1);
  if (!rawQ2 || rawQ2.length > MAX_FIELD_VALUE_LENGTH || !q2Allowed.includes(rawQ2)) {
    return { ok: false, reason: "stage_mismatch" };
  }

  const values: Record<string, string> = { q1: rawQ1, q2: rawQ2 };

  for (const id of QUESTION_ORDER) {
    if (id === "q1" || id === "q2") continue;
    const raw = firstParamValue(rawParams[id]);
    const allowed = ALLOWED_VALUES[id];
    if (!raw || raw.length > MAX_FIELD_VALUE_LENGTH || !allowed.includes(raw)) {
      return { ok: false, reason: "incomplete" };
    }
    values[id] = raw;
  }

  if (values.q6 === "no_home_issue" && values.q7 === "consider_home_income") {
    return { ok: false, reason: "home_contradiction" };
  }

  return { ok: true, answers: values as unknown as PostValidAnswers };
}

/**
 * 他ページ（お問い合わせページなど）へ診断結果URLを引き継ぐ際の検証関数。
 * "/diagnosis/result?..." という形の相対パスで、かつ実際に復号可能な内容のときだけ
 * 正規化したパスを返す。それ以外の入力はすべて null を返す（オープンリダイレクト対策）。
 */
export function parsePostResultPath(raw: string | undefined | null): string | null {
  if (!raw || raw.length > 300) return null;
  if (!raw.startsWith(`${POST_RESULT_PATH}?`)) return null;

  let url: URL;
  try {
    url = new URL(raw, "https://placeholder.invalid");
  } catch {
    return null;
  }
  if (url.pathname !== POST_RESULT_PATH) return null;

  const params: PostSearchParams = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const decoded = decodePostParams(params);
  if (!decoded.ok) return null;

  return buildPostResultPath(decoded.answers);
}
