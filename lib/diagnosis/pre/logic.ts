import type { PreAnswers, PreResult, PreResultItem, PreWho } from "./types";
import type { PreQuestionId } from "./types";
import {
  PRE_FACTS,
  INTEGRATION_T1D_Q6C,
  INTEGRATION_Q7C_Q9C,
  INTEGRATION_T2D_Q10C,
  INTEGRATION_Q10B_T5C,
  INTEGRATION_Q10C_T5C,
  INTEGRATION_T2D_Q10C_T5C,
  SPECIAL_ROLE_SHARING_A,
  SPECIAL_ROLE_SHARING_B,
  SPECIAL_ROLE_SHARING_FALLBACK_T4B,
  SPECIAL_ROLE_SHARING_FALLBACK_T4D,
  type PreFactEntry,
} from "./mapping";

/**
 * 「3分整理ナビ｜平時ブランチ」（m=pre）結果ロジック。
 * docs/reference/navi-result-mapping.md 第4章（特別ロジック）をそのまま実装したもの。
 * ロジックを調整する場合は、必ず同文書を先に更新してからここを編集すること。
 */

const QUESTION_ORDER: PreQuestionId[] = [
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

function orderKeyOf(ids: PreQuestionId[]): number {
  return Math.min(...ids.map((id) => QUESTION_ORDER.indexOf(id)));
}

type PooledItem = PreFactEntry & { orderKey: number };

// 第4-③節「身近に頼れる方がいない場合でも、公的な相談窓口や専門職と一緒に整理できる方法があります。」
const NO_ONE_NEARBY_BANNER =
  "身近に頼れる方がいない場合でも、公的な相談窓口や専門職と一緒に整理できる方法があります。";

// 第6-2節：共有ボタンの遷移先文言
const SHARE_AUDIENCE_DEFAULT = "ご家族や信頼できる方に";
const SHARE_AUDIENCE_SUPPORT_ORG = "支援機関の方に";

export function buildPreResult(who: PreWho, answers: PreAnswers): PreResult {
  const a: string[] = [];
  const bPool: PooledItem[] = [];

  const push = (entry: PreFactEntry, ids: PreQuestionId[]) => {
    if (entry.category === "skip") return;
    if (entry.category === "A") {
      if (entry.fact) a.push(entry.fact);
      return;
    }
    bPool.push({ ...entry, orderKey: orderKeyOf(ids) });
  };

  // マージ対象コード（T1d/Q6c、Q7c/Q9c、T2d/Q10b/Q10c/T5c）は個別に評価するため、
  // 汎用ループでは除外する。
  const MERGE_ONLY: Partial<Record<PreQuestionId, Set<string>>> = {
    T1: new Set(["d"]),
    Q6: new Set(["c"]),
    Q7: new Set(["c"]),
    Q9: new Set(["c"]),
    T2: new Set(["d"]),
    Q10: new Set(["b", "c"]),
    T5: new Set(["c"]),
  };

  for (const id of QUESTION_ORDER) {
    if (id === "T4") continue; // T4はQ8と合わせて専用ロジックで処理する
    const code = answers[id];
    if (!code) continue; // T1/T4がQ1/Q7の回答により非該当の場合はここで自然にスキップされる
    if (MERGE_ONLY[id]?.has(code)) continue; // 後段でまとめて評価する
    const entry = PRE_FACTS[`${id}${code}`];
    if (!entry) continue;
    push(entry, [id]);
  }

  // ---- 第4-②節：支える人（Q7×Q8×T4） ----
  const q8 = answers.Q8;
  const t4 = answers.T4;
  let q8Consumed = false;

  if (t4 === "a") {
    push(PRE_FACTS.T4a, ["T4"]);
  } else if (t4 === "b") {
    if (q8 === "a") {
      push(SPECIAL_ROLE_SHARING_A, ["T4", "Q8"]);
      q8Consumed = true;
    } else {
      push(SPECIAL_ROLE_SHARING_FALLBACK_T4B, ["T4"]);
    }
  } else if (t4 === "d") {
    if (q8 === "a") {
      push(SPECIAL_ROLE_SHARING_B, ["T4", "Q8"]);
      q8Consumed = true;
    } else {
      push(SPECIAL_ROLE_SHARING_FALLBACK_T4D, ["T4"]);
    }
  }

  if (!q8Consumed && q8) {
    const entry = PRE_FACTS[`Q8${q8}`];
    if (entry) push(entry, ["Q8"]);
  }

  // ---- 第4-④節A：希望や暮らしについて話す相手（T1d × Q6c） ----
  const hasT1d = answers.T1 === "d";
  const hasQ6c = answers.Q6 === "c";
  if (hasT1d && hasQ6c) {
    push(INTEGRATION_T1D_Q6C, ["T1", "Q6"]);
  } else {
    if (hasT1d) push(PRE_FACTS.T1d, ["T1"]);
    if (hasQ6c) push(PRE_FACTS.Q6c, ["Q6"]);
  }

  // ---- 第4-③節：身近に頼れる方がいない（Q7c × Q9c） ----
  const hasQ7c = answers.Q7 === "c";
  const hasQ9c = answers.Q9 === "c";
  if (hasQ7c && hasQ9c) {
    push(INTEGRATION_Q7C_Q9C, ["Q7", "Q9"]);
  } else {
    if (hasQ7c) push(PRE_FACTS.Q7c, ["Q7"]);
    if (hasQ9c) push(PRE_FACTS.Q9c, ["Q9"]);
  }

  // ---- 第4-④節B・C・D：お金・書類（評価順序: 3条件 → 2条件 → 個別） ----
  const hasT2d = answers.T2 === "d";
  const hasQ10b = answers.Q10 === "b";
  const hasQ10c = answers.Q10 === "c";
  const hasT5c = answers.T5 === "c";

  let t2dConsumed = false;
  let q10bConsumed = false;
  let q10cConsumed = false;
  let t5cConsumed = false;

  if (hasT2d && hasQ10c && hasT5c) {
    push(INTEGRATION_T2D_Q10C_T5C, ["T2", "Q10", "T5"]);
    t2dConsumed = true;
    q10cConsumed = true;
    t5cConsumed = true;
  } else {
    if (hasT2d && hasQ10c) {
      push(INTEGRATION_T2D_Q10C, ["T2", "Q10"]);
      t2dConsumed = true;
      q10cConsumed = true;
    }
    if (hasQ10b && hasT5c) {
      push(INTEGRATION_Q10B_T5C, ["Q10", "T5"]);
      q10bConsumed = true;
      t5cConsumed = true;
    }
    if (hasQ10c && hasT5c && !q10cConsumed && !t5cConsumed) {
      push(INTEGRATION_Q10C_T5C, ["Q10", "T5"]);
      q10cConsumed = true;
      t5cConsumed = true;
    }
  }

  if (hasT2d && !t2dConsumed) push(PRE_FACTS.T2d, ["T2"]);
  if (hasQ10b && !q10bConsumed) push(PRE_FACTS.Q10b, ["Q10"]);
  if (hasQ10c && !q10cConsumed) push(PRE_FACTS.Q10c, ["Q10"]);
  if (hasT5c && !t5cConsumed) push(PRE_FACTS.T5c, ["T5"]);

  // ---- 並べ替え（優先度昇順、同値は設問順） ----
  bPool.sort((x, y) => (x.priority ?? 99) - (y.priority ?? 99) || x.orderKey - y.orderKey);

  const toItem = (entry: PooledItem): PreResultItem => ({
    category: "B",
    fact: entry.fact ?? "",
    point: entry.point,
    area: entry.area,
    priority: entry.priority,
  });

  const bannerActive = answers.Q7 === "c" || answers.Q9 === "c";

  return {
    who,
    banner: bannerActive ? NO_ONE_NEARBY_BANNER : null,
    shareAudienceLabel: bannerActive ? SHARE_AUDIENCE_SUPPORT_ORG : SHARE_AUDIENCE_DEFAULT,
    a,
    bTop3: bPool.slice(0, 3).map(toItem),
    bRest: bPool.slice(3).map(toItem),
  };
}
