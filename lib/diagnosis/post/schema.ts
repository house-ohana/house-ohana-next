import type { PostValidAnswers, PostCommonQuestionId } from "./types";

/**
 * 「3分整理ナビ｜事後ブランチ」（m=post）のURLクエリ仕様（POST_SCHEMA_VERSION）。
 *
 * 設計方針:
 * - URLには氏名・住所・病名・資産額などを含めず、質問IDに対応する短い英数字IDのみを含める。
 * - POST_SCHEMA_VERSIONは、質問ID・回答コード・URL互換性を表すスキーマバージョン。
 *   docs/01-phase2-question-architecture.md（Phase2 質問構造再設計）により質問構成そのものが変わるため、
 *   "3.1" から "4.0" へ引き上げる。
 * - 共通質問（c1〜c8）は必須。条件付き質問（s1／h1・h2／ct1）は該当する場合のみURLに含める
 *   （lib/diagnosis/pre/schema.ts のT1/T4と同じ方式）。該当しないのに値がある、
 *   または該当するのに値がない場合は、推測で補正せずデコード失敗として扱う。
 * - 旧v=3.1・旧v=m-post-v2.1のURLは、vの値が一致しないため自動的に unsupported_version となり、
 *   推測変換せず安全に案内画面へ戻せる。
 * - C1=future の回答は結果URLとして生成・受理しない（案内画面はウィザード内で完結する）。
 */

export const POST_SCHEMA_VERSION = "4.0";
export const POST_RESULT_PATH = "/diagnosis/result";

const ACTIVE_C2_VALUES = ["within_7_days", "within_30_days", "date_unknown", "no_deadline", "unknown"] as const;
const DISCHARGED_C2_VALUES = ["urgent_after_discharge", "some_unresolved", "mostly_settled", "unknown"] as const;

const COMMON_ALLOWED_VALUES: Record<Exclude<PostCommonQuestionId, "c2">, readonly string[]> = {
  c1: ["hospitalized", "discharged", "facility_search", "future"],
  c3: ["return_home", "temporary_home", "facility", "undecided", "other"],
  c4: ["arranged", "partly_arranged", "not_arranged", "not_needed_said", "unknown"],
  c5: ["wants_home", "wants_facility", "considering", "not_discussed", "hard_to_confirm", "unknown"],
  c6: ["person_returns", "may_return", "will_be_vacant", "already_vacant", "family_uses", "no_home_issue", "unknown"],
  c7: ["likely_sufficient", "unknown_amount", "family_pays", "mixed", "unknown"],
  c8: ["shared", "mostly_one_person", "few_supporters", "unknown"],
};

const S1_VALUES = ["certified_with_manager", "certified_no_manager", "applying", "not_applied", "unknown"] as const;
const H1_VALUES = ["sell", "rent", "demolish", "keep_for_now", "undecided"] as const;
const H2_VALUES = ["sole_owner", "shared_owner", "other_owner", "unknown"] as const;
const CT1_VALUES = ["clearly_understands", "fluctuates", "seems_difficult", "not_confirmed", "unknown"] as const;

const COMMON_QUESTION_ORDER: PostCommonQuestionId[] = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

const MAX_FIELD_VALUE_LENGTH = 40;

export type PostSearchParams = Record<string, string | string[] | undefined>;

export type PostDecodeFailureReason =
  | "missing_version"
  | "unsupported_version"
  | "incomplete"
  | "stage_mismatch"
  | "future_not_supported"
  | "invalid_mode";

export type PostDecodeResult = { ok: true; answers: PostValidAnswers } | { ok: false; reason: PostDecodeFailureReason };

function firstParamValue(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

function allowedC2Values(c1: string): readonly string[] {
  return c1 === "discharged" ? DISCHARGED_C2_VALUES : ACTIVE_C2_VALUES;
}

function isSupportBranchApplicable(values: Record<string, string>): boolean {
  const maximallyUncertain = values.c4 === "unknown" && values.c6 === "unknown" && values.c7 === "unknown" && values.c8 === "unknown";
  if (maximallyUncertain) return false;
  return values.c4 === "partly_arranged" || values.c4 === "not_arranged" || values.c4 === "unknown";
}

function isHomeBranchApplicable(values: Record<string, string>): boolean {
  const maximallyUncertain = values.c4 === "unknown" && values.c6 === "unknown" && values.c7 === "unknown" && values.c8 === "unknown";
  if (maximallyUncertain) return false;
  return values.c6 !== "no_home_issue" && values.c6 !== "unknown";
}

function isContractBranchApplicable(values: Record<string, string>): boolean {
  return values.h1 === "sell" || values.h1 === "rent" || values.h1 === "demolish";
}

export function encodePostAnswers(answers: PostValidAnswers): string {
  const params = new URLSearchParams();
  params.set("m", "post");
  params.set("v", POST_SCHEMA_VERSION);
  for (const id of COMMON_QUESTION_ORDER) {
    params.set(id, answers[id]);
  }
  if (answers.s1) params.set("s1", answers.s1);
  if (answers.h1) params.set("h1", answers.h1);
  if (answers.h2) params.set("h2", answers.h2);
  if (answers.ct1) params.set("ct1", answers.ct1);
  return params.toString();
}

export function buildPostResultPath(answers: PostValidAnswers): string {
  return `${POST_RESULT_PATH}?${encodePostAnswers(answers)}`;
}

export function decodePostParams(rawParams: PostSearchParams): PostDecodeResult {
  const rawVersion = firstParamValue(rawParams.v);
  if (!rawVersion) return { ok: false, reason: "missing_version" };
  if (rawVersion !== POST_SCHEMA_VERSION) return { ok: false, reason: "unsupported_version" };

  const rawC1 = firstParamValue(rawParams.c1);
  if (!rawC1 || rawC1.length > MAX_FIELD_VALUE_LENGTH || !COMMON_ALLOWED_VALUES.c1.includes(rawC1)) {
    return { ok: false, reason: "incomplete" };
  }
  if (rawC1 === "future") {
    // futureは結果URLとして成立しない（ウィザード内の案内画面のみで完結する）
    return { ok: false, reason: "future_not_supported" };
  }

  const rawC2 = firstParamValue(rawParams.c2);
  const c2Allowed = allowedC2Values(rawC1);
  if (!rawC2 || rawC2.length > MAX_FIELD_VALUE_LENGTH || !c2Allowed.includes(rawC2)) {
    return { ok: false, reason: "stage_mismatch" };
  }

  const values: Record<string, string> = { c1: rawC1, c2: rawC2 };

  for (const id of COMMON_QUESTION_ORDER) {
    if (id === "c1" || id === "c2") continue;
    const raw = firstParamValue(rawParams[id]);
    const allowed = COMMON_ALLOWED_VALUES[id];
    if (!raw || raw.length > MAX_FIELD_VALUE_LENGTH || !allowed.includes(raw)) {
      return { ok: false, reason: "incomplete" };
    }
    values[id] = raw;
  }

  // 支援枝（s1）
  const rawS1 = firstParamValue(rawParams.s1);
  if (isSupportBranchApplicable(values)) {
    if (!rawS1 || !S1_VALUES.includes(rawS1 as (typeof S1_VALUES)[number])) return { ok: false, reason: "incomplete" };
    values.s1 = rawS1;
  } else if (rawS1) {
    // 非該当なのにパラメータがある場合は不整合として扱う（推測補正しない）
    return { ok: false, reason: "incomplete" };
  }

  // 実家枝（h1）
  const rawH1 = firstParamValue(rawParams.h1);
  if (isHomeBranchApplicable(values)) {
    if (!rawH1 || !H1_VALUES.includes(rawH1 as (typeof H1_VALUES)[number])) return { ok: false, reason: "incomplete" };
    values.h1 = rawH1;
  } else if (rawH1) {
    return { ok: false, reason: "incomplete" };
  }

  // 実家枝の続き（h2）＋契約枝（ct1）。いずれもh1が売る・貸す・解体のときだけ成立する。
  const rawH2 = firstParamValue(rawParams.h2);
  const rawCt1 = firstParamValue(rawParams.ct1);
  if (isContractBranchApplicable(values)) {
    if (!rawH2 || !H2_VALUES.includes(rawH2 as (typeof H2_VALUES)[number])) return { ok: false, reason: "incomplete" };
    values.h2 = rawH2;
    if (!rawCt1 || !CT1_VALUES.includes(rawCt1 as (typeof CT1_VALUES)[number])) return { ok: false, reason: "incomplete" };
    values.ct1 = rawCt1;
  } else if (rawH2 || rawCt1) {
    return { ok: false, reason: "incomplete" };
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
