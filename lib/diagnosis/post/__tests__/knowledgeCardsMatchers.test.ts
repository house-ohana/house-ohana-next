import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { computePostVariables } from "../variables";
import type { PostVariables } from "../variables";
import type { PostValidAnswers } from "../types";
import {
  matchDischargeSupportStartGap,
  matchTransitionMonthlyCashGap,
  matchHomeOwnershipIntentGap,
  matchKnowledgeCards,
} from "../knowledgeCards/matchers";

// このテストファイルは Phase4.1 Step2 のmatcher（発火判定）だけを対象とする。
// selector・PostResult接続・UIのテストは含まない。

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

// PostVariablesの「completeな既定値＋Partialによる上書き」ファクトリ。
// matcherは`v: PostVariables`を直接受け取るため、実際に到達可能な回答の組み合わせに
// 縛られず、matcherの優先順ロジック自体を検証するためのフラグ組み合わせを直接構成する。
const DEFAULT_VARIABLES: PostVariables = computePostVariables(BASELINE);
function vars(overrides: Partial<PostVariables>): PostVariables {
  return { ...DEFAULT_VARIABLES, ...overrides };
}

describe("matchDischargeSupportStartGap: 発火条件", () => {
  test("1. hospitalized + supportUnclear → 表示する", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: true, supportPartlyUnclear: false, residenceUnclear: false }),
    );
    assert.equal(m.matched, true);
  });

  test("2. hospitalized + supportPartlyUnclear → 表示する", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: false, supportPartlyUnclear: true, residenceUnclear: false }),
    );
    assert.equal(m.matched, true);
  });

  test("3. hospitalized + residenceUnclear → 表示する", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: false, supportPartlyUnclear: false, residenceUnclear: true }),
    );
    assert.equal(m.matched, true);
  });

  test("4. hospitalized + supportUnclear + residenceUnclear → 表示する", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: true, supportPartlyUnclear: false, residenceUnclear: true }),
    );
    assert.equal(m.matched, true);
  });

  test("5. discharged + supportUnclear → 表示しない", () => {
    const m = matchDischargeSupportStartGap(answers({ c1: "discharged" }), vars({ supportUnclear: true }));
    assert.equal(m.matched, false);
  });

  test("6. facility_search + residenceUnclear → 表示しない", () => {
    const m = matchDischargeSupportStartGap(answers({ c1: "facility_search" }), vars({ residenceUnclear: true }));
    assert.equal(m.matched, false);
  });

  test("7. hospitalizedだが3フラグすべてfalse → 表示しない", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: false, supportPartlyUnclear: false, residenceUnclear: false }),
    );
    assert.equal(m.matched, false);
  });

  test("8. future等の非入院状態 → 表示しない", () => {
    const m = matchDischargeSupportStartGap(answers({ c1: "future" }), vars({ supportUnclear: true, residenceUnclear: true }));
    assert.equal(m.matched, false);
  });

  test("matched=falseにはcardId以外のフィールドが無い", () => {
    const m = matchDischargeSupportStartGap(answers({ c1: "discharged" }), vars({}));
    assert.equal(m.matched, false);
    assert.deepEqual(Object.keys(m).sort(), ["cardId", "matched"]);
  });
});

describe("matchDischargeSupportStartGap: reason優先順", () => {
  test("9. supportUnclear + residenceUnclear → discharge_support_and_residence_gap", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: true, supportPartlyUnclear: false, residenceUnclear: true }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "discharge_support_and_residence_gap");
  });

  test("10. supportPartlyUnclear + residenceUnclear → discharge_support_and_residence_gap", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: false, supportPartlyUnclear: true, residenceUnclear: true }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "discharge_support_and_residence_gap");
  });

  test("11. supportUnclear + supportPartlyUnclear（residenceUnclearなし）→ discharge_support_not_arranged", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: true, supportPartlyUnclear: true, residenceUnclear: false }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "discharge_support_not_arranged");
  });
});

describe("matchDischargeSupportStartGap: urgency", () => {
  test("12. isImmediateDeadline=true → high", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: true, isImmediateDeadline: true }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.urgency, "high");
  });

  test("13. isImmediateDeadline=false → medium", () => {
    const m = matchDischargeSupportStartGap(
      answers({ c1: "hospitalized" }),
      vars({ supportUnclear: true, isImmediateDeadline: false }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.urgency, "medium");
  });

  test("rankは常に10", () => {
    const m = matchDischargeSupportStartGap(answers({ c1: "hospitalized" }), vars({ supportUnclear: true }));
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.rank, 10);
  });
});

describe("matchTransitionMonthlyCashGap", () => {
  test("1. familyContribution=true → 表示する", () => {
    const m = matchTransitionMonthlyCashGap(vars({ familyContribution: true, moneyNeedsEarlyCheck: false, moneyUnclear: false }));
    assert.equal(m.matched, true);
  });

  test("2. familyContribution=false → 表示しない", () => {
    const m = matchTransitionMonthlyCashGap(vars({ familyContribution: false }));
    assert.equal(m.matched, false);
  });

  test("3. moneyUnclear=true, familyContribution=false → 表示しない", () => {
    const m = matchTransitionMonthlyCashGap(vars({ familyContribution: false, moneyUnclear: true }));
    assert.equal(m.matched, false);
  });

  test("4. moneyNeedsEarlyCheck=true, familyContribution=false → 表示しない", () => {
    const m = matchTransitionMonthlyCashGap(vars({ familyContribution: false, moneyNeedsEarlyCheck: true }));
    assert.equal(m.matched, false);
  });

  test("5. familyContribution=true, moneyNeedsEarlyCheck=true → urgent reason, rank15, high", () => {
    const m = matchTransitionMonthlyCashGap(vars({ familyContribution: true, moneyNeedsEarlyCheck: true, moneyUnclear: false }));
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "money_family_contribution_urgent");
    assert.equal(m.matched && m.rank, 15);
    assert.equal(m.matched && m.urgency, "high");
  });

  test("6. familyContribution=true, moneyNeedsEarlyCheck=false, moneyUnclear=true → unclear reason, rank30, medium", () => {
    const m = matchTransitionMonthlyCashGap(vars({ familyContribution: true, moneyNeedsEarlyCheck: false, moneyUnclear: true }));
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "money_family_contribution_and_unclear");
    assert.equal(m.matched && m.rank, 30);
    assert.equal(m.matched && m.urgency, "medium");
  });

  test("7. familyContribution=true, moneyNeedsEarlyCheck=false, moneyUnclear=false → base reason, rank30, medium", () => {
    const m = matchTransitionMonthlyCashGap(vars({ familyContribution: true, moneyNeedsEarlyCheck: false, moneyUnclear: false }));
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "money_family_contribution");
    assert.equal(m.matched && m.rank, 30);
    assert.equal(m.matched && m.urgency, "medium");
  });

  test("8. moneyNeedsEarlyCheckとmoneyUnclearが両方true → urgent reasonを優先", () => {
    const m = matchTransitionMonthlyCashGap(vars({ familyContribution: true, moneyNeedsEarlyCheck: true, moneyUnclear: true }));
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "money_family_contribution_urgent");
  });
});

describe("matchHomeOwnershipIntentGap", () => {
  test("1. homeActionExpected=true + ownershipUnclear → 表示する", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: true, contractStatusUnknown: false, contractConcern: false }),
    );
    assert.equal(m.matched, true);
  });

  test("2. homeActionExpected=true + contractStatusUnknown → 表示する", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: false, contractStatusUnknown: true, contractConcern: false }),
    );
    assert.equal(m.matched, true);
  });

  test("3. homeActionExpected=true + contractConcern → 表示する", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: false, contractStatusUnknown: false, contractConcern: true }),
    );
    assert.equal(m.matched, true);
  });

  test("4. homeActionExpected=false + ownershipUnclear → 表示しない", () => {
    const m = matchHomeOwnershipIntentGap(vars({ homeActionExpected: false, ownershipUnclear: true }));
    assert.equal(m.matched, false);
  });

  test("5. homeActionExpected=trueだが3条件すべてfalse → 表示しない", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: false, contractStatusUnknown: false, contractConcern: false }),
    );
    assert.equal(m.matched, false);
  });

  test("6. contractConcern + ownershipUnclear → home_contract_concern", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: true, contractStatusUnknown: false, contractConcern: true }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "home_contract_concern");
  });

  test("7. contractConcern + contractStatusUnknown → home_contract_concern", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: false, contractStatusUnknown: true, contractConcern: true }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "home_contract_concern");
  });

  test("8. ownershipUnclear + contractStatusUnknown（contractConcernなし）→ home_ownership_and_intent_unclear", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: true, contractStatusUnknown: true, contractConcern: false }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.reasonId, "home_ownership_and_intent_unclear");
  });

  test("9. contractConcern時 → rank20, high", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: false, contractStatusUnknown: false, contractConcern: true }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.rank, 20);
    assert.equal(m.matched && m.urgency, "high");
  });

  test("10. contractConcernでない該当時 → rank20, medium", () => {
    const m = matchHomeOwnershipIntentGap(
      vars({ homeActionExpected: true, ownershipUnclear: true, contractStatusUnknown: false, contractConcern: false }),
    );
    assert.equal(m.matched, true);
    assert.equal(m.matched && m.rank, 20);
    assert.equal(m.matched && m.urgency, "medium");
  });
});

describe("matchKnowledgeCards: 集約", () => {
  test("常に3件返す", () => {
    const results = matchKnowledgeCards(answers({}), vars({}));
    assert.equal(results.length, 3);
  });

  test("固定カード順で返す", () => {
    const results = matchKnowledgeCards(answers({}), vars({}));
    assert.deepEqual(
      results.map((r) => r.cardId),
      ["discharge_support_start_gap", "transition_monthly_cash_gap", "home_ownership_intent_gap"],
    );
  });

  test("cardIdの重複が無い", () => {
    const results = matchKnowledgeCards(answers({}), vars({}));
    const ids = results.map((r) => r.cardId);
    assert.equal(new Set(ids).size, ids.length);
  });

  test("同じ入力なら同じ結果（決定論性）", () => {
    const a = answers({ c1: "hospitalized" });
    const v = vars({ supportUnclear: true, familyContribution: true, homeActionExpected: true, ownershipUnclear: true });
    assert.deepEqual(matchKnowledgeCards(a, v), matchKnowledgeCards(a, v));
  });
});

describe("matchers.ts: import責務", () => {
  // コメント（説明文）に語が登場しても誤検出しないよう、import文だけを抽出して検査する。
  function importLines(): string[] {
    const source = readFileSync(fileURLToPath(new URL("../knowledgeCards/matchers.ts", import.meta.url)), "utf-8");
    return source.split("\n").filter((line) => line.trim().startsWith("import "));
  }

  test("content・registry・reasonsをimportしていない", () => {
    const imports = importLines().join("\n");
    assert.doesNotMatch(imports, /from "\.\/content"|from "\.\/registry"|from "\.\/reasons"/);
  });

  test("UI（DiagnosisResultSections）をimportしていない", () => {
    const imports = importLines().join("\n");
    assert.doesNotMatch(imports, /DiagnosisResultSections/);
  });

  test("importは4件のみ（../types／../variables／./types×2）", () => {
    assert.equal(importLines().length, 4);
  });
});
