export type DiagnosisMode = "pre" | "post" | "invalid";

/**
 * `m` クエリパラメータからブランチを判定する。
 * `m` が無い既存URL（共有済みリンク・ブックマーク）は、後方互換のため
 * 従来の事後ブランチ（m=post）として扱う（docs/reference/implementation-instructions.md 1-11）。
 * `m=after` や `m=test` などの不正値は、m=post として誤って扱わず "invalid" を返す。
 */
export function resolveDiagnosisMode(raw: string | string[] | undefined): DiagnosisMode {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return "post";
  if (value === "pre") return "pre";
  if (value === "post") return "post";
  return "invalid";
}
