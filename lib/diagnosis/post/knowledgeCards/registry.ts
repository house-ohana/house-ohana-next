import type { KnowledgeCardRegistryEntry } from "./types";
import { DISCHARGE_SUPPORT_START_GAP, TRANSITION_MONTHLY_CASH_GAP, HOME_OWNERSHIP_INTENT_GAP } from "./content";

/**
 * content本体とは別に管理する運用メタデータ（enabled）の一覧。
 * 回答値・Variablesは参照せず、match判定も行わない。固定本文は複製せず、content.tsの
 * 各contentをそのまま参照する。
 * Step1時点では出典確認・専門家レビューが未完了のため、3カードとも enabled: false とする
 * （docs/03 第4章、docs/instructions 第5章）。
 */
export const KNOWLEDGE_CARD_REGISTRY: readonly KnowledgeCardRegistryEntry[] = [
  { content: DISCHARGE_SUPPORT_START_GAP, enabled: false },
  { content: TRANSITION_MONTHLY_CASH_GAP, enabled: false },
  { content: HOME_OWNERSHIP_INTENT_GAP, enabled: false },
];
