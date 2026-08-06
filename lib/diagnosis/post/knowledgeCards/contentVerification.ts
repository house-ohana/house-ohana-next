import type { KnowledgeCardContent } from "./types";

/**
 * enabled=trueへ切り替える前に、出典確認が完了しているかを検証する純粋関数。
 * disabledのカードは未確認状態（sources: [] / verifiedAt: null / reviewBy: null）を
 * 許容する。enabledにする場合は、sourcesが1件以上、verifiedAt／reviewByが有効な日付
 * 文字列であることを要求する（docs/instructions 第4章・第7章）。
 * matcher・selectorではない。selectorが将来enabled判定に利用することを想定した、
 * content単体に閉じた検証ロジックである。
 */
export function isContentReadyToEnable(content: KnowledgeCardContent): boolean {
  if (content.sources.length === 0) return false;
  if (content.verifiedAt === null || Number.isNaN(Date.parse(content.verifiedAt))) return false;
  if (content.reviewBy === null || Number.isNaN(Date.parse(content.reviewBy))) return false;
  return true;
}
