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
import { buildKnowledgeCardsForPostResult } from "../knowledgeCards/buildKnowledgeCards";
import { DISCHARGE_SUPPORT_START_GAP, TRANSITION_MONTHLY_CASH_GAP, HOME_OWNERSHIP_INTENT_GAP } from "../knowledgeCards/content";
import type { KnowledgeCardId, KnowledgeCardRegistryEntry } from "../knowledgeCards/types";
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

describe("buildPostResult().knowledgeCards: 本番registry（Card Aだけenabled、2026-08-06〜）", () => {
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

  test("4. 入院中・支援未調整の回答では、Card Aが1件返る（2026-08-06有効化後の正式状態）", () => {
    const result = buildPostResult(answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" }));
    assert.equal(result.knowledgeCards.length, 1);
    assert.equal(result.knowledgeCards[0]?.id, "discharge_support_start_gap");
  });

  test("5. familyContribution=trueの回答でも空配列", () => {
    const result = buildPostResult(answers({ c7: "family_pays" }));
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("6. homeActionExpected=trueかつcontractConcern=trueでも空配列", () => {
    const result = buildPostResult(answers({ c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "fluctuates" }));
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("7. 複数matcherが発火する回答でも、本番registryではCard Aだけ返る（Card B・Cはenabled=falseのまま）", () => {
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
    assert.equal(result.knowledgeCards.length, 1);
    assert.deepEqual(
      result.knowledgeCards.map((c) => c.id),
      ["discharge_support_start_gap"],
    );
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

// 本番contentを参照しつつ、enabledだけをテスト用の値で持つ新しいregistryを作る（knowledgeCardsBuilder
// テストと同じ方式）。本番KNOWLEDGE_CARD_REGISTRYはmutateしない。
function testRegistry(enabled: Partial<Record<KnowledgeCardId, boolean>>): readonly KnowledgeCardRegistryEntry[] {
  return [
    { content: DISCHARGE_SUPPORT_START_GAP, enabled: enabled.discharge_support_start_gap ?? false },
    { content: TRANSITION_MONTHLY_CASH_GAP, enabled: enabled.transition_monthly_cash_gap ?? false },
    { content: HOME_OWNERSHIP_INTENT_GAP, enabled: enabled.home_ownership_intent_gap ?? false },
  ];
}

describe("Step6A: knowledgeCards.linkedContactIdsとcontactsの積集合が成立すること", () => {
  test("本番buildPostResult(): knowledgeCardsの全linkedContactIdsがcontacts内に存在する（一般不変条件、Card Aの実データで成立）", () => {
    const a = answers({
      c1: "hospitalized",
      c2: "within_7_days",
      c3: "undecided",
      c4: "not_arranged",
      c6: "will_be_vacant",
      c7: "family_pays",
      h1: "sell",
      h2: "sole_owner",
      ct1: "fluctuates",
    });
    const result = buildPostResult(a);
    const contactIds = new Set(result.contacts.map((c) => c.id));
    for (const card of result.knowledgeCards) {
      for (const linkedId of card.linkedContactIds) {
        assert.ok(contactIds.has(linkedId), `${card.id}: ${linkedId} がcontactsに存在しない`);
      }
    }
    // 本番registryはCard Aだけenabledのため（2026-08-06〜）、この不変条件は
    // knowledgeCards=[Card A]という実データのもとで成立することを確認する。
    assert.equal(result.knowledgeCards.length, 1);
    assert.equal(result.knowledgeCards[0]?.id, "discharge_support_start_gap");
  });

  test("enabledなregistry・実際のbuildContacts結果で積集合が成立する（Card Aがhospitalと一致）", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" });
    const v = computePostVariables(a);
    const contacts = buildContacts(a, v);
    const cards = buildKnowledgeCardsForPostResult(
      a,
      v,
      contacts,
      testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.ok(cards.length > 0, "この回答ではCard Aが発火するはず");
    const contactIds = new Set(contacts.map((c) => c.id));
    for (const card of cards) {
      for (const linkedId of card.linkedContactIds) {
        assert.ok(contactIds.has(linkedId), `${card.id}: ${linkedId} がcontactsに存在しない`);
      }
    }
    // hospitalは実際にCard Aのlinked先かつbuildContactsの結果にも含まれるため、
    // 積集合が空配列ではなく実際に絞り込まれていることを確認する。
    const cardA = cards.find((c) => c.id === "discharge_support_start_gap");
    assert.deepEqual(cardA?.linkedContactIds, ["hospital"]);
  });

  test("enabledなregistry・real_estateしか無いcontactsでもCard Cは残り、real_estateは追加されない", () => {
    const a = answers({ c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "fluctuates" });
    const v = computePostVariables(a);
    const cards = buildKnowledgeCardsForPostResult(
      a,
      v,
      [{ id: "real_estate", name: "不動産会社", questions: [] }],
      testRegistry({ home_ownership_intent_gap: true }),
    );
    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.id, "home_ownership_intent_gap");
    assert.deepEqual(cards[0]?.linkedContactIds, []);
  });
});

// ---- Step6B: Card A有効化前レビュー（docs/reviews/phase4.1-card-a-enablement-review.md） ----

describe("Step6B: Card Aだけenabledな場合のPostResult相当の結果", () => {
  const CARD_A_ONLY = testRegistry({ discharge_support_start_gap: true });

  test("入院中・支援未調整の回答で、Card Aだけenabledなら1件、Card B/Cは混入しない", () => {
    const a = answers({
      c1: "hospitalized",
      c2: "within_7_days",
      c3: "undecided",
      c4: "not_arranged",
      c6: "will_be_vacant",
      c7: "family_pays",
      h1: "sell",
      h2: "sole_owner",
      ct1: "fluctuates",
    });
    const v = computePostVariables(a);
    const contacts = buildContacts(a, v);
    const cards = buildKnowledgeCardsForPostResult(a, v, contacts, CARD_A_ONLY);
    assert.equal(cards.length, 1);
    assert.deepEqual(
      cards.map((c) => c.id),
      ["discharge_support_start_gap"],
    );
  });

  test("実際のbuildContactsとの積集合で、result.knowledgeCardsの全linkedContactIdsがcontacts内に存在する", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" });
    const v = computePostVariables(a);
    const contacts = buildContacts(a, v);
    const cards = buildKnowledgeCardsForPostResult(a, v, contacts, CARD_A_ONLY);
    const contactIds = new Set(contacts.map((c) => c.id));
    for (const card of cards) {
      for (const linkedId of card.linkedContactIds) {
        assert.ok(contactIds.has(linkedId), `${card.id}: ${linkedId}`);
      }
    }
  });

  test("Card Aが未発火の回答では、Card Aだけenabledでも空配列", () => {
    const a = answers({});
    const v = computePostVariables(a);
    const cards = buildKnowledgeCardsForPostResult(a, v, buildContacts(a, v), CARD_A_ONLY);
    assert.deepEqual(cards, []);
  });

  test("本番: 本番registry（省略時）ではCard Aの発火条件を満たす回答で1件返る（2026-08-06有効化後）", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" });
    const result = buildPostResult(a);
    assert.equal(result.knowledgeCards.length, 1);
    assert.equal(result.knowledgeCards[0]?.id, "discharge_support_start_gap");
  });

  test("本番回帰: firstAction・nextActions・contactsはCard A有効化テストの影響を受けない", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);
    assert.deepEqual(result.firstAction, buildFirstAndNextActions(a, v).firstAction);
    assert.deepEqual(result.nextActions, buildFirstAndNextActions(a, v).nextActions);
    assert.deepEqual(result.contacts, buildContacts(a, v));
  });
});

// ---- Step6C: Card A本番有効化（docs/reviews/phase4.1-card-a-enablement-result.md） ----

describe("Card A本番有効化後: 表示ケース・非表示ケース", () => {
  test("表示ケース: 入院中・Card Aのギャップ成立 → knowledgeCardsはCard Aだけの1件", () => {
    const a = answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" });
    const v = computePostVariables(a);
    const result = buildPostResult(a);

    assert.equal(result.knowledgeCards.length, 1);
    assert.deepEqual(
      result.knowledgeCards.map((c) => c.id),
      ["discharge_support_start_gap"],
    );

    // linkedContactIdsはresult.contactsの部分集合である
    const contactIds = new Set(result.contacts.map((c) => c.id));
    for (const linkedId of result.knowledgeCards[0]?.linkedContactIds ?? []) {
      assert.ok(contactIds.has(linkedId));
    }

    // firstAction・nextActionsは既存ロジックのままである
    assert.deepEqual(result.firstAction, buildFirstAndNextActions(a, v).firstAction);
    assert.deepEqual(result.nextActions, buildFirstAndNextActions(a, v).nextActions);

    // contactsはKnowledge Cardのために増えていない（buildContacts(a, v)の結果と完全一致）
    assert.deepEqual(result.contacts, buildContacts(a, v));
  });

  test("非表示ケース: Card A条件不成立（入院中でない）→ knowledgeCards=[]", () => {
    const a = answers({ c1: "discharged", c3: "return_home", c4: "arranged" });
    const result = buildPostResult(a);
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("非表示ケース: 入院中だが3ギャップ変数がすべてfalse → knowledgeCards=[]", () => {
    const a = answers({ c1: "hospitalized", c2: "date_unknown", c3: "return_home", c4: "arranged" });
    const result = buildPostResult(a);
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("非表示ケース: Card Bのみ成立（Card A不成立）→ knowledgeCards=[]", () => {
    const a = answers({ c1: "discharged", c7: "family_pays" });
    const result = buildPostResult(a);
    assert.deepEqual(result.knowledgeCards, []);
  });

  test("非表示ケース: Card Cのみ成立（Card A不成立）→ knowledgeCards=[]", () => {
    const a = answers({ c1: "discharged", c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "fluctuates" });
    const result = buildPostResult(a);
    assert.deepEqual(result.knowledgeCards, []);
  });
});
