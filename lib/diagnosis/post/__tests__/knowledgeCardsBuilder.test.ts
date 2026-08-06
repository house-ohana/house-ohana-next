import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computePostVariables } from "../variables";
import type { PostValidAnswers } from "../types";
import { buildKnowledgeCards } from "../knowledgeCards/buildKnowledgeCards";
import { getWhyNow } from "../knowledgeCards/reasons";
import { DISCHARGE_SUPPORT_START_GAP, TRANSITION_MONTHLY_CASH_GAP, HOME_OWNERSHIP_INTENT_GAP } from "../knowledgeCards/content";
import type { KnowledgeCardId, KnowledgeCardRegistryEntry } from "../knowledgeCards/types";

// このテストファイルは Phase4.1 Step3 のbuildKnowledgeCards（matcher→selectorの接続）だけを
// 対象とする。PostResult接続・URL・UIのテストは knowledgeCardsIntegration.test.ts で行う。

const BASELINE: PostValidAnswers = {
  c1: "discharged",
  c2: "mostly_settled",
  c3: "return_home",
  c4: "arranged",
  c5: "wants_home",
  c6: "no_home_issue",
  c7: "likely_sufficient",
  c8: "shared",
};

function answers(overrides: Partial<PostValidAnswers>): PostValidAnswers {
  return { ...BASELINE, ...overrides };
}

// 本番contentを参照しつつ、enabledだけをテスト用の値で持つ新しいregistryを作る。
// 本番KNOWLEDGE_CARD_REGISTRYはmutateしない（selectorのテストと同じ方式）。
function testRegistry(enabled: Partial<Record<KnowledgeCardId, boolean>>): readonly KnowledgeCardRegistryEntry[] {
  return [
    { content: DISCHARGE_SUPPORT_START_GAP, enabled: enabled.discharge_support_start_gap ?? false },
    { content: TRANSITION_MONTHLY_CASH_GAP, enabled: enabled.transition_monthly_cash_gap ?? false },
    { content: HOME_OWNERSHIP_INTENT_GAP, enabled: enabled.home_ownership_intent_gap ?? false },
  ];
}

// Card Aをsupport系フラグだけで発火させ、Card Bのactive_support_gap経由でのmoneyNeedsEarlyCheck
// 連動を避けたいテストで使う（c4=partly_arrangedはhospitalizedSupportGapに含まれない）。
const ALL_THREE_FIRE_NORMAL: PostValidAnswers = answers({
  c1: "hospitalized",
  c2: "date_unknown",
  c3: "return_home",
  c4: "partly_arranged",
  c6: "will_be_vacant",
  c7: "family_pays",
  h1: "sell",
  ct1: "fluctuates",
});

const ALL_THREE_FIRE_URGENT: PostValidAnswers = answers({
  c1: "hospitalized",
  c2: "within_7_days",
  c3: "return_home",
  c4: "partly_arranged",
  c6: "will_be_vacant",
  c7: "family_pays",
  h1: "sell",
  ct1: "fluctuates",
});

describe("buildKnowledgeCards: 本番registry", () => {
  test("1. 本番registryでは常に空配列", () => {
    const a = answers({});
    const result = buildKnowledgeCards(a, computePostVariables(a));
    assert.deepEqual(result, []);
  });

  test("2. matcherが発火する回答でも、本番registryでは空配列", () => {
    const a = answers({ c1: "hospitalized", c4: "not_arranged" });
    const result = buildKnowledgeCards(a, computePostVariables(a));
    assert.deepEqual(result, []);
  });

  test("3. matcherが発火しない回答でも空配列", () => {
    const a = answers({});
    const result = buildKnowledgeCards(a, computePostVariables(a));
    assert.deepEqual(result, []);
  });

  test("4. 同じ入力なら常に同じ結果（決定論性）", () => {
    const a = ALL_THREE_FIRE_NORMAL;
    const v = computePostVariables(a);
    const registry = testRegistry({
      discharge_support_start_gap: true,
      transition_monthly_cash_gap: true,
      home_ownership_intent_gap: true,
    });
    assert.deepEqual(buildKnowledgeCards(a, v, registry), buildKnowledgeCards(a, v, registry));
  });
});

describe("buildKnowledgeCards: テスト用registryでの単独発火", () => {
  test("5. Card Aだけenabledで発火 → Card Aを1件返す", () => {
    const a = answers({ c1: "hospitalized", c4: "not_arranged" });
    const result = buildKnowledgeCards(a, computePostVariables(a), testRegistry({ discharge_support_start_gap: true }));
    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "discharge_support_start_gap");
  });

  test("6. Card BだけenabledでfamilyContribution=true → Card Bを1件返す", () => {
    const a = answers({ c7: "family_pays" });
    const result = buildKnowledgeCards(a, computePostVariables(a), testRegistry({ transition_monthly_cash_gap: true }));
    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "transition_monthly_cash_gap");
  });

  test("7. Card BだけenabledでmoneyUnclear=trueかつfamilyContribution=false → 空配列", () => {
    const a = answers({ c7: "unknown_amount" });
    const result = buildKnowledgeCards(a, computePostVariables(a), testRegistry({ transition_monthly_cash_gap: true }));
    assert.deepEqual(result, []);
  });

  test("8. Card CだけenabledでhomeActionExpected=trueかつcontractConcern=true → Card Cを1件返す", () => {
    const a = answers({ c6: "will_be_vacant", h1: "sell", ct1: "fluctuates" });
    const result = buildKnowledgeCards(a, computePostVariables(a), testRegistry({ home_ownership_intent_gap: true }));
    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "home_ownership_intent_gap");
  });
});

describe("buildKnowledgeCards: rank順と最大件数", () => {
  const ALL_ENABLED = testRegistry({
    discharge_support_start_gap: true,
    transition_monthly_cash_gap: true,
    home_ownership_intent_gap: true,
  });

  test("9. 3カードenabledかつ全カード発火 → rank順で最大2件", () => {
    const a = ALL_THREE_FIRE_NORMAL;
    const result = buildKnowledgeCards(a, computePostVariables(a), ALL_ENABLED);
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "home_ownership_intent_gap"],
    );
  });

  test("10. Card BがmoneyNeedsEarlyCheck=true（A rank10, B rank15, C rank20）→ A・B", () => {
    const a = ALL_THREE_FIRE_URGENT;
    const result = buildKnowledgeCards(a, computePostVariables(a), ALL_ENABLED);
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "transition_monthly_cash_gap"],
    );
  });

  test("11. Card Bが通常rank30（A rank10, C rank20, B rank30）→ A・C", () => {
    const a = ALL_THREE_FIRE_NORMAL;
    const result = buildKnowledgeCards(a, computePostVariables(a), ALL_ENABLED);
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "home_ownership_intent_gap"],
    );
  });

  test("16. 3カードとも発火・enabledでも戻り値は最大2件", () => {
    const a = ALL_THREE_FIRE_URGENT;
    const result = buildKnowledgeCards(a, computePostVariables(a), ALL_ENABLED);
    assert.ok(result.length <= 2);
  });
});

describe("buildKnowledgeCards: whyNowと固定文", () => {
  test("12. whyNowが正しいreasonIdの固定文と一致する", () => {
    const a = answers({ c1: "hospitalized", c4: "not_arranged" });
    const result = buildKnowledgeCards(a, computePostVariables(a), testRegistry({ discharge_support_start_gap: true }));
    assert.equal(result[0]?.whyNow, getWhyNow("discharge_support_not_arranged"));
  });
});

describe("buildKnowledgeCards: 副作用が無いこと", () => {
  test("13. 入力Answersを変更しない", () => {
    const a = ALL_THREE_FIRE_NORMAL;
    const before = JSON.parse(JSON.stringify(a));
    buildKnowledgeCards(
      a,
      computePostVariables(a),
      testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.deepEqual(a, before);
  });

  test("14. 入力PostVariablesを変更しない", () => {
    const a = ALL_THREE_FIRE_NORMAL;
    const v = computePostVariables(a);
    const before = JSON.parse(JSON.stringify(v));
    buildKnowledgeCards(
      a,
      v,
      testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.deepEqual(v, before);
  });

  test("15. registryを変更しない", () => {
    const a = ALL_THREE_FIRE_NORMAL;
    const registry = testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true });
    const before = JSON.parse(JSON.stringify(registry));
    buildKnowledgeCards(a, computePostVariables(a), registry);
    assert.deepEqual(registry, before);
  });
});
