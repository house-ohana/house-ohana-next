import type { KnowledgeCardRegistryEntry } from "./types";
import { DISCHARGE_SUPPORT_START_GAP, TRANSITION_MONTHLY_CASH_GAP, HOME_OWNERSHIP_INTENT_GAP } from "./content";

/**
 * content本体とは別に管理する運用メタデータ（enabled）の一覧。
 * 回答値・Variablesは参照せず、match判定も行わない。固定本文は複製せず、content.tsの
 * 各contentをそのまま参照する。
 * discharge_support_start_gap（Card A）は、docs/reviews/phase4.1-knowledge-card-source-review.md
 * および docs/reviews/phase4.1-card-a-enablement-review.md のレビューを経て enabled: true とした
 * （2026-08-06、docs/reviews/phase4.1-card-a-enablement-result.md参照）。
 * transition_monthly_cash_gap・home_ownership_intent_gap（Card B・C）は、出典確認・専門家レビューは
 * 完了しているが、有効化前レビューが未実施のため enabled: false のまま維持する。
 */
export const KNOWLEDGE_CARD_REGISTRY: readonly KnowledgeCardRegistryEntry[] = [
  { content: DISCHARGE_SUPPORT_START_GAP, enabled: true },
  { content: TRANSITION_MONTHLY_CASH_GAP, enabled: false },
  { content: HOME_OWNERSHIP_INTENT_GAP, enabled: false },
];
