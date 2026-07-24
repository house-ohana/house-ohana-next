export type DiagnosisMode = "pre" | "post";

/**
 * `m` クエリパラメータからブランチを判定する。
 * `m` が無い既存URL（共有済みリンク・ブックマーク）は、後方互換のため
 * 従来の事後ブランチ（m=post）として扱う（docs/implementation-instructions.md 1-11）。
 */
export function resolveDiagnosisMode(raw: string | string[] | undefined): DiagnosisMode {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "pre" ? "pre" : "post";
}
