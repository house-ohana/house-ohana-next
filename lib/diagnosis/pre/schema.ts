import type { PreAnswers, PreQuestionId, PreWho } from "./types";

/**
 * 「3分整理ナビ｜平時ブランチ」（m=pre）のURLクエリ仕様。
 *
 * 設計方針（lib/diagnosis/schema.tsの事後ブランチと同じ考え方）:
 * - URLには短い許可コードのみを含める（質問文・自由記述を含めない）。
 * - 各設問の回答コードは docs/navi-result-mapping.md 第1節の a/b/c/d/e をそのまま使う
 *   （事後ブランチのようなvalue→1文字変換テーブルは不要。コード自体が既に1文字のため）。
 * - v=<number> で平時ブランチの質問セットのバージョンを管理する。post側のvとは
 *   独立したバージョン空間（m=preのときだけ参照される）。
 * - T1・T4は前の回答（Q1=a／Q7=a）で成立しない場合、パラメータ自体を付けない。
 *   逆に、成立しない状態でパラメータが付いているURLは改ざん・不整合とみなし無効化する。
 * - T5のb（口頭でのみ伝えている）は Q10=a のときしか成立しない。
 */

const QUESTION_PARAM: Record<PreQuestionId, string> = {
  Q1: "q1",
  Q2: "q2",
  T1: "t1",
  Q3: "q3",
  Q4: "q4",
  T2: "t2",
  Q5: "q5",
  Q6: "q6",
  T3: "t3",
  Q7: "q7",
  Q8: "q8",
  T4: "t4",
  Q9: "q9",
  Q10: "q10",
  T5: "t5",
};

// 各設問で許可される回答コード（docs/navi-result-mapping.md 第1節と完全一致させる）
const ALLOWED_CODES: Record<PreQuestionId, readonly string[]> = {
  Q1: ["a", "b", "c"],
  Q2: ["a", "b", "c"],
  T1: ["a", "b", "d"],
  Q3: ["a", "b", "c"],
  Q4: ["a", "b", "c", "d", "e"],
  T2: ["a", "b", "c", "d"],
  Q5: ["a", "b", "c"],
  Q6: ["a", "b", "c"],
  T3: ["a", "b", "c"],
  Q7: ["a", "b", "c", "d"],
  Q8: ["a", "b", "c", "d"],
  T4: ["a", "b", "d"],
  Q9: ["a", "b", "c", "d"],
  Q10: ["a", "b", "c"],
  T5: ["a", "b", "c"],
};

const V1_QUESTIONS: readonly PreQuestionId[] = [
  "Q1",
  "Q2",
  "T1",
  "Q3",
  "Q4",
  "T2",
  "Q5",
  "Q6",
  "T3",
  "Q7",
  "Q8",
  "T4",
  "Q9",
  "Q10",
  "T5",
];

const SCHEMA_BY_VERSION: Record<number, readonly PreQuestionId[]> = {
  1: V1_QUESTIONS,
};

export const PRE_CURRENT_VERSION = 1;
export const PRE_RESULT_PATH = "/diagnosis/result";

export type PreSearchParams = Record<string, string | string[] | undefined>;

export type PreDecodeResult =
  | { ok: true; version: number; who: PreWho; answers: PreAnswers }
  | {
      ok: false;
      reason: "missing_version" | "unsupported_version" | "missing_who" | "incomplete";
    };

function firstParamValue(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

function isT1Applicable(answers: PreAnswers): boolean {
  return answers.Q1 === "a";
}

function isT4Applicable(answers: PreAnswers): boolean {
  return answers.Q7 === "a";
}

function allowedT5Codes(answers: PreAnswers): readonly string[] {
  // Q10=a のときだけ「口頭でのみ伝えている(b)」を許可する（第1-⑤節）
  return answers.Q10 === "a" ? ALLOWED_CODES.T5 : ALLOWED_CODES.T5.filter((code) => code !== "b");
}

export function encodePreAnswers(
  who: PreWho,
  answers: PreAnswers,
  version: number = PRE_CURRENT_VERSION,
): string {
  const questions = SCHEMA_BY_VERSION[version];
  if (!questions) throw new Error(`Unknown pre-diagnosis schema version: ${version}`);

  const params = new URLSearchParams();
  params.set("m", "pre");
  params.set("v", String(version));
  params.set("who", who);

  for (const id of questions) {
    const code = answers[id];
    if (!code) continue; // T1/T4が非該当の場合はここで自然に省略される
    params.set(QUESTION_PARAM[id], code);
  }

  return params.toString();
}

export function buildPreResultPath(
  who: PreWho,
  answers: PreAnswers,
  version: number = PRE_CURRENT_VERSION,
): string {
  return `${PRE_RESULT_PATH}?${encodePreAnswers(who, answers, version)}`;
}

export function decodePreParams(rawParams: PreSearchParams): PreDecodeResult {
  const rawVersion = firstParamValue(rawParams.v);
  if (!rawVersion) return { ok: false, reason: "missing_version" };

  const version = Number(rawVersion);
  if (!Number.isInteger(version) || version < 1) {
    return { ok: false, reason: "unsupported_version" };
  }

  const questions = SCHEMA_BY_VERSION[version];
  if (!questions) return { ok: false, reason: "unsupported_version" };

  const rawWho = firstParamValue(rawParams.who);
  if (rawWho !== "self" && rawWho !== "family") {
    return { ok: false, reason: "missing_who" };
  }
  const who: PreWho = rawWho;

  const answers: PreAnswers = {};

  for (const id of questions) {
    const raw = firstParamValue(rawParams[QUESTION_PARAM[id]]);

    if (id === "T1") {
      if (isT1Applicable(answers)) {
        if (!raw || !ALLOWED_CODES.T1.includes(raw)) return { ok: false, reason: "incomplete" };
        answers.T1 = raw;
      } else if (raw) {
        // Q1=aでないのにT1が付いているURLは不整合とみなす
        return { ok: false, reason: "incomplete" };
      }
      continue;
    }

    if (id === "T4") {
      if (isT4Applicable(answers)) {
        if (!raw || !ALLOWED_CODES.T4.includes(raw)) return { ok: false, reason: "incomplete" };
        answers.T4 = raw;
      } else if (raw) {
        return { ok: false, reason: "incomplete" };
      }
      continue;
    }

    if (id === "T5") {
      const allowed = allowedT5Codes(answers);
      if (!raw || !allowed.includes(raw)) return { ok: false, reason: "incomplete" };
      answers.T5 = raw;
      continue;
    }

    if (!raw || !ALLOWED_CODES[id].includes(raw)) {
      return { ok: false, reason: "incomplete" };
    }
    answers[id] = raw;
  }

  return { ok: true, version, who, answers };
}
