import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildPostResult } from "../logic";
import { encodePostAnswers, decodePostParams, POST_SCHEMA_VERSION, type PostSearchParams } from "../schema";
import { computePostVariables } from "../variables";
import { buildFirstAndNextActions } from "../actions";
import { buildDecisions } from "../decisions";
import { buildInsights } from "../insights";
import { buildContacts } from "../contacts";
import { buildSelfHelp, buildAskProfessional } from "../selfHelp";
import { computeConsultationFlags } from "../consultation";
import { buildConfirmedFacts } from "../artifacts/buildConfirmedFacts";
import { buildUnknownItems } from "../artifacts/buildUnknownItems";
import type { PostValidAnswers } from "../types";

// このテストファイルは Phase4.1 Step3 の「PostResult.knowledgeCards接続」と「既存結果層の
// 無変更」だけを対象とする。matcher・selector自体のロジックは knowledgeCardsMatchers.test.ts /
// knowledgeCardsSelector.test.ts / knowledgeCardsBuilder.test.ts で検証済み。

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

describe("buildPostResult().knowledgeCards: 本番registryでは常に空配列", () => {
  test("1. m=post結果にknowledgeCardsプロパティが存在する", () => {
    const result = buildPostResult(answers({}));
    assert.ok("knowledgeCards" in result);
  });

  test("2. knowledgeCardsは配列である", () => {
    const result = buildPostResult(answers({}));
    assert.ok(Array.isArray(result.knowledgeCards));
  });

  test("3. 本番registryが全件disabledのため空配列である", () => {
    const result = buildPostResult(answers({}));
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("4. 入院中・支援未調整の回答でも空配列", () => {
    const result = buildPostResult(answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" }));
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("5. familyContribution=trueの回答でも空配列", () => {
    const result = buildPostResult(answers({ c7: "family_pays" }));
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("6. homeActionExpected=trueかつcontractConcern=trueでも空配列", () => {
    const result = buildPostResult(answers({ c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "fluctuates" }));
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("7. 複数matcherが発火する回答でも空配列", () => {
    const result = buildPostResult(
      answers({
        c1: "hospitalized",
        c2: "within_7_days",
        c3: "undecided",
        c4: "not_arranged",
        c6: "will_be_vacant",
        c7: "family_pays",
        h1: "sell",
        h2: "sole_owner",
        ct1: "fluctuates",
      }),
    );
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("8. 同じAnswersから常に同じknowledgeCardsを返す", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c4: "not_arranged" });
    assert.deepEqual(buildPostResult(a).knowledgeCards, buildPostResult(a).knowledgeCards);
  });
});

describe("buildPostResult(): 既存結果層が変更されていないこと", () => {
  test("9. PostResultの既存フィールドがすべて残っている", () => {
    const result = buildPostResult(answers({}));
    const expectedKeys = [
      "schemaVersion",
      "situation",
      "firstAction",
      "nextActions",
      "decideNow",
      "decideLater",
      "decideLaterCaveat",
      "insights",
      "contacts",
      "selfHelp",
      "askProfessional",
      "consultation",
      "artifacts",
      "knowledgeCards",
    ];
    for (const key of expectedKeys) {
      assert.ok(key in result, `${key} が存在しない`);
    }
  });

  test("10. firstActionが変更されていない", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.firstAction, buildFirstAndNextActions(a, v).firstAction);
  });

  test("11. nextActionsが変更されていない", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.nextActions, buildFirstAndNextActions(a, v).nextActions);
  });

  test("12. decisionsが変更されていない（decideNow／decideLater／decideLaterCaveat）", () => {
    const a = answers({ c7: "family_pays" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    const decisions = buildDecisions(a, v);
    assert.deepEqual(result.decideNow, decisions.decideNow);
    assert.deepEqual(result.decideLater, decisions.decideLater);
    assert.equal(result.decideLaterCaveat, decisions.laterCaveat);
  });

  test("13. insightsが変更されていない", () => {
    const a = answers({ c8: "few_supporters" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.insights, buildInsights(a, v));
  });

  test("14. artifactsが変更されていない", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c4: "not_arranged" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.artifacts.confirmedFacts, buildConfirmedFacts(a, v));
    assert.deepEqual(result.artifacts.unknownItems, buildUnknownItems(v));
  });

  test("15. contactsが変更されていない", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c4: "not_arranged" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.contacts, buildContacts(a, v));
  });

  test("16. selfHelpが変更されていない（selfHelp／askProfessional）", () => {
    const a = answers({ c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "fluctuates" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.selfHelp, buildSelfHelp(a, v));
    assert.deepEqual(result.askProfessional, buildAskProfessional(a, v));
  });

  test("17. consultationが変更されていない", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.consultation, computeConsultationFlags(v));
  });

  test("18. confirmedFactsが変更されていない", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c4: "not_arranged" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.artifacts.confirmedFacts, buildConfirmedFacts(a, v));
  });

  test("19. unknownItemsが変更されていない", () => {
    const a = answers({});
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.artifacts.unknownItems, buildUnknownItems(v));
  });
});

describe("URL・schema回帰: knowledgeCards追加がURL互換性へ影響しないこと", () => {
  test("既存URLからAnswersを復元できる", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged", s1: "not_applied" });
    const encoded = encodePostAnswers(a);
    const params: PostSearchParams = {};
    for (const [key, value] of new URLSearchParams(encoded)) {
      params[key] = value;
    }
    const decoded = decodePostParams(params);
    assert.equal(decoded.ok, true);
    assert.deepEqual(decoded.ok && decoded.answers, a);
  });

  test("復元したAnswersからPostResultを再生成できる", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged", s1: "not_applied" });
    const encoded = encodePostAnswers(a);
    const params: PostSearchParams = {};
    for (const [key, value] of new URLSearchParams(encoded)) {
      params[key] = value;
    }
    const decoded = decodePostParams(params);
    assert.equal(decoded.ok, true);
    if (!decoded.ok) return;
    const result = buildPostResult(decoded.answers);
    assert.ok(Array.isArray(result.knowledgeCards));
  });

  test("再生成したPostResult.knowledgeCardsは空配列", () => {
    const a = answers({ c7: "family_pays" });
    const encoded = encodePostAnswers(a);
    const params: PostSearchParams = {};
    for (const [key, value] of new URLSearchParams(encoded)) {
      params[key] = value;
    }
    const decoded = decodePostParams(params);
    assert.equal(decoded.ok, true);
    if (!decoded.ok) return;
    const result = buildPostResult(decoded.answers);
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("POST_SCHEMA_VERSIONは変更しない（4.0のまま）", () => {
    assert.equal(POST_SCHEMA_VERSION, "4.0");
  });

  test("URLパラメータへknowledgeCardsを追加しない", () => {
    const a = answers({ c7: "family_pays" });
    const encoded = encodePostAnswers(a);
    const params = new URLSearchParams(encoded);
    assert.equal(params.has("knowledgeCards"), false);
  });

  test("encodePostAnswersは既存の質問IDパラメータだけを含む", () => {
    const a = answers({ c1: "hospitalized", c4: "not_arranged" });
    const encoded = encodePostAnswers(a);
    const params = new URLSearchParams(encoded);
    const keys = new Set(params.keys());
    for (const key of keys) {
      assert.ok(["m", "v", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "s1", "h1", "h2", "ct1"].includes(key), `想定外のパラメータ: ${key}`);
    }
  });
});
