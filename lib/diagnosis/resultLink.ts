import { parsePostResultPath } from "./post/schema";
import { buildPreResultPath, decodePreParams, PRE_RESULT_PATH, type PreSearchParams } from "./pre/schema";
import { resolveDiagnosisMode } from "./mode";

/**
 * 事後ブランチ（m=post・またはmなし）と平時ブランチ（m=pre）の両方の診断結果URLを
 * 検証・正規化する。他ページ（お問い合わせ等）へ引き継ぐ際の入口はここに一本化する。
 * 事後ブランチ側のデコード処理（lib/diagnosis/post/schema.ts）は変更しない。
 */
export function parseAnyDiagnosisResultPath(raw: string | undefined | null): string | null {
  if (!raw || raw.length > 300) return null;

  let url: URL;
  try {
    url = new URL(raw, "https://placeholder.invalid");
  } catch {
    return null;
  }

  if (url.pathname !== PRE_RESULT_PATH) return null;

  const params: PreSearchParams = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const mode = resolveDiagnosisMode(params.m);

  if (mode === "pre") {
    const decoded = decodePreParams(params);
    if (!decoded.ok) return null;
    return buildPreResultPath(decoded.who, decoded.answers, decoded.version);
  }

  return parsePostResultPath(raw);
}
