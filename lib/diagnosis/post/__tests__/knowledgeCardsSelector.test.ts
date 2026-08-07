import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { selectKnowledgeCards } from "../knowledgeCards/selector";
import { KNOWLEDGE_CARD_REGISTRY } from "../knowledgeCards/registry";
import { DISCHARGE_SUPPORT_START_GAP, TRANSITION_MONTHLY_CASH_GAP, HOME_OWNERSHIP_INTENT_GAP } from "../knowledgeCards/content";
import { getWhyNow } from "../knowledgeCards/reasons";
import type { KnowledgeCardId, KnowledgeCardMatch, KnowledgeCardRegistryEntry } from "../knowledgeCards/types";

// このテストファイルは Phase4.1 Step2 のselector（集約・整列・最大件数）だけを対象とする。
// 本番KNOWLEDGE_CARD_REGISTRYは変更せず、テストごとに新しいreadonly registryを生成する。

function matchedFalse(cardId: KnowledgeCardId): KnowledgeCardMatch {
  return { matched: false, cardId };
}

function matchedTrue(
  cardId: KnowledgeCardId,
  rank: number,
  urgency: "high" | "medium" = "medium",
): KnowledgeCardMatch {
  const reasonId =
    cardId === "discharge_support_start_gap"
      ? "discharge_support_not_arranged"
      : cardId === "transition_monthly_cash_gap"
        ? "money_family_contribution"
        : "home_ownership_unclear";
  return { matched: true, cardId, reasonId, rank, urgency };
}

// 本番contentを参照しつつ、enabledだけをテスト用の値で持つ新しいregistryを作る。
// 本番KNOWLEDGE_CARD_REGISTRYはmutateしない。
function testRegistry(enabled: Partial<Record<KnowledgeCardId, boolean>>): readonly KnowledgeCardRegistryEntry[] {
  return [
    { content: DISCHARGE_SUPPORT_START_GAP, enabled: enabled.discharge_support_start_gap ?? false },
    { content: TRANSITION_MONTHLY_CASH_GAP, enabled: enabled.transition_monthly_cash_gap ?? false },
    { content: HOME_OWNERSHIP_INTENT_GAP, enabled: enabled.home_ownership_intent_gap ?? false },
  ];
}

const ALL_MATCHED_TRUE: readonly KnowledgeCardMatch[] = [
  matchedTrue("discharge_support_start_gap", 10),
  matchedTrue("transition_monthly_cash_gap", 30),
  matchedTrue("home_ownership_intent_gap", 20),
];

describe("selectKnowledgeCards: 本番registryとenabled", () => {
  // 2026-08-06にCard A（discharge_support_start_gap）がenabled=trueへ変更された
  // （docs/reviews/phase4.1-card-a-enablement-result.md）。
  // 2026-08-06にCard B（transition_monthly_cash_gap）がenabled=trueへ変更された
  // （docs/reviews/phase4.1-card-b-enablement-result.md）。Card Cはenabled=falseのまま。
  test("1. 本番registryはCard A・Bがenabledなので、3カードともmatched=trueならA, Bがrank順で返る（Cはenabled=falseなので出ない）", () => {
    const result = selectKnowledgeCards(ALL_MATCHED_TRUE, KNOWLEDGE_CARD_REGISTRY);
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "transition_monthly_cash_gap"],
    );
  });

  test("引数省略時も本番registryを使う（同じくA, Bが返る）", () => {
    const result = selectKnowledgeCards(ALL_MATCHED_TRUE);
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "transition_monthly_cash_gap"],
    );
  });

  test("Card Aがmatched=falseでも、本番registryでBはenabledなのでBだけ返る（Cはenabled=falseなので出ない）", () => {
    const matches = [
      matchedFalse("discharge_support_start_gap"),
      matchedTrue("transition_monthly_cash_gap", 30),
      matchedTrue("home_ownership_intent_gap", 20),
    ];
    const result = selectKnowledgeCards(matches, KNOWLEDGE_CARD_REGISTRY);
    assert.deepEqual(
      result.map((r) => r.id),
      ["transition_monthly_cash_gap"],
    );
  });

  test("2. matched=falseだけなら空配列", () => {
    const matches = [
      matchedFalse("discharge_support_start_gap"),
      matchedFalse("transition_monthly_cash_gap"),
      matchedFalse("home_ownership_intent_gap"),
    ];
    const result = selectKnowledgeCards(matches, testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true }));
    assert.deepEqual(result, []);
  });

  test("3. matched=trueでもenabled=falseなら除外される", () => {
    const result = selectKnowledgeCards([matchedTrue("discharge_support_start_gap", 10)], testRegistry({}));
    assert.deepEqual(result, []);
  });

  test("16. 0件時（空のmatches配列）は空配列", () => {
    const result = selectKnowledgeCards([], testRegistry({ discharge_support_start_gap: true }));
    assert.deepEqual(result, []);
  });
});

describe("selectKnowledgeCards: 件数と並び順", () => {
  test("4. 1件enabledなら1件返る", () => {
    const result = selectKnowledgeCards(ALL_MATCHED_TRUE, testRegistry({ transition_monthly_cash_gap: true }));
    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "transition_monthly_cash_gap");
  });

  test("5. 2件enabledならrank順に2件", () => {
    const result = selectKnowledgeCards(
      ALL_MATCHED_TRUE,
      testRegistry({ transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.deepEqual(
      result.map((r) => r.id),
      ["home_ownership_intent_gap", "transition_monthly_cash_gap"],
    );
  });

  test("6. 3件enabledでも最大2件", () => {
    const result = selectKnowledgeCards(
      ALL_MATCHED_TRUE,
      testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.equal(result.length, 2);
  });

  test("7. A rank10, B rank15, C rank20 → A, B", () => {
    const matches = [
      matchedTrue("discharge_support_start_gap", 10),
      matchedTrue("transition_monthly_cash_gap", 15),
      matchedTrue("home_ownership_intent_gap", 20),
    ];
    const result = selectKnowledgeCards(
      matches,
      testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "transition_monthly_cash_gap"],
    );
  });

  test("8. A rank10, C rank20, B rank30 → A, C", () => {
    const matches = [
      matchedTrue("discharge_support_start_gap", 10),
      matchedTrue("transition_monthly_cash_gap", 30),
      matchedTrue("home_ownership_intent_gap", 20),
    ];
    const result = selectKnowledgeCards(
      matches,
      testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "home_ownership_intent_gap"],
    );
  });

  test("9. B rank30, C rank20だけ該当 → C, B", () => {
    const matches = [matchedTrue("transition_monthly_cash_gap", 30), matchedTrue("home_ownership_intent_gap", 20)];
    const result = selectKnowledgeCards(
      matches,
      testRegistry({ transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.deepEqual(
      result.map((r) => r.id),
      ["home_ownership_intent_gap", "transition_monthly_cash_gap"],
    );
  });

  test("10. 同rankなら固定カード順（入力順に依存しない）", () => {
    // わざと固定順と逆順でmatchesを渡す
    const matches = [
      matchedTrue("home_ownership_intent_gap", 10),
      matchedTrue("discharge_support_start_gap", 10),
    ];
    const result = selectKnowledgeCards(
      matches,
      testRegistry({ discharge_support_start_gap: true, home_ownership_intent_gap: true }),
    );
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "home_ownership_intent_gap"],
    );
  });

  test("17. 出力は最大2件（3件同順位でも2件）", () => {
    const matches = [
      matchedTrue("discharge_support_start_gap", 10),
      matchedTrue("transition_monthly_cash_gap", 10),
      matchedTrue("home_ownership_intent_gap", 10),
    ];
    const result = selectKnowledgeCards(
      matches,
      testRegistry({ discharge_support_start_gap: true, transition_monthly_cash_gap: true, home_ownership_intent_gap: true }),
    );
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map((r) => r.id),
      ["discharge_support_start_gap", "transition_monthly_cash_gap"],
    );
  });

  test("18. disabledカードが上位rankでも表示されない", () => {
    const matches = [matchedTrue("discharge_support_start_gap", 10), matchedTrue("transition_monthly_cash_gap", 30)];
    const result = selectKnowledgeCards(matches, testRegistry({ transition_monthly_cash_gap: true }));
    assert.deepEqual(
      result.map((r) => r.id),
      ["transition_monthly_cash_gap"],
    );
  });
});

describe("selectKnowledgeCards: 出力内容", () => {
  test("11. whyNowがreasonId対応文と一致する", () => {
    const match = matchedTrue("home_ownership_intent_gap", 20);
    const result = selectKnowledgeCards([match], testRegistry({ home_ownership_intent_gap: true }));
    assert.equal(match.matched, true);
    assert.equal(result[0]?.whyNow, match.matched ? getWhyNow(match.reasonId) : undefined);
  });

  test("12. contentのtitle・cliff・checkItems等が結合される", () => {
    const result = selectKnowledgeCards(
      [matchedTrue("discharge_support_start_gap", 10)],
      testRegistry({ discharge_support_start_gap: true }),
    );
    const card = result[0];
    assert.ok(card);
    assert.equal(card.title, DISCHARGE_SUPPORT_START_GAP.title);
    assert.equal(card.cliff, DISCHARGE_SUPPORT_START_GAP.cliff);
    assert.deepEqual(card.checkItems, DISCHARGE_SUPPORT_START_GAP.checkItems);
    assert.deepEqual(card.linkedContactIds, DISCHARGE_SUPPORT_START_GAP.linkedContactIds);
    assert.deepEqual(card.sources, DISCHARGE_SUPPORT_START_GAP.sources);
    assert.equal(card.verifiedAt, DISCHARGE_SUPPORT_START_GAP.verifiedAt);
    assert.equal(card.reviewBy, DISCHARGE_SUPPORT_START_GAP.reviewBy);
    assert.equal(card.rank, 10);
  });

  test("12b. Card Bのcontentが正しく結合される（sources3件を含む、Card B有効化前レビュー）", () => {
    const result = selectKnowledgeCards(
      [matchedTrue("transition_monthly_cash_gap", 30)],
      testRegistry({ transition_monthly_cash_gap: true }),
    );
    const card = result[0];
    assert.ok(card);
    assert.equal(card.title, TRANSITION_MONTHLY_CASH_GAP.title);
    assert.equal(card.cliff, TRANSITION_MONTHLY_CASH_GAP.cliff);
    assert.deepEqual(card.checkItems, TRANSITION_MONTHLY_CASH_GAP.checkItems);
    assert.deepEqual(card.linkedContactIds, TRANSITION_MONTHLY_CASH_GAP.linkedContactIds);
    assert.equal(card.sources.length, 3);
    assert.deepEqual(card.sources, TRANSITION_MONTHLY_CASH_GAP.sources);
    assert.equal(card.verifiedAt, TRANSITION_MONTHLY_CASH_GAP.verifiedAt);
    assert.equal(card.reviewBy, TRANSITION_MONTHLY_CASH_GAP.reviewBy);
    assert.equal(card.rank, 30);
  });
});

describe("selectKnowledgeCards: 副作用が無いこと・決定論性", () => {
  test("13. selectorが入力matchesを変更しない", () => {
    const matches = [matchedTrue("discharge_support_start_gap", 10)];
    const before = JSON.parse(JSON.stringify(matches));
    selectKnowledgeCards(matches, testRegistry({ discharge_support_start_gap: true }));
    assert.deepEqual(matches, before);
  });

  test("14. selectorがregistryを変更しない", () => {
    const registry = testRegistry({ discharge_support_start_gap: true });
    const before = JSON.parse(JSON.stringify(registry));
    selectKnowledgeCards([matchedTrue("discharge_support_start_gap", 10)], registry);
    assert.deepEqual(registry, before);
  });

  test("14b. 本番KNOWLEDGE_CARD_REGISTRYを変更しない", () => {
    const before = JSON.parse(JSON.stringify(KNOWLEDGE_CARD_REGISTRY));
    selectKnowledgeCards(ALL_MATCHED_TRUE, KNOWLEDGE_CARD_REGISTRY);
    assert.deepEqual(KNOWLEDGE_CARD_REGISTRY, before);
  });

  test("15. 同じ入力で常に同じ結果", () => {
    const matches = [matchedTrue("discharge_support_start_gap", 10), matchedTrue("home_ownership_intent_gap", 20)];
    const registry = testRegistry({ discharge_support_start_gap: true, home_ownership_intent_gap: true });
    assert.deepEqual(selectKnowledgeCards(matches, registry), selectKnowledgeCards(matches, registry));
  });
});

describe("selector.ts: import責務", () => {
  // コメント（説明文）に型名が登場しても誤検出しないよう、import文だけを抽出して検査する
  // （TypeScriptのimport構造そのもので責務分離を確認する）。
  function importLines(): string[] {
    const source = readFileSync(fileURLToPath(new URL("../knowledgeCards/selector.ts", import.meta.url)), "utf-8");
    return source.split("\n").filter((line) => line.trim().startsWith("import "));
  }

  test("Answers型・PostVariables型をimportしていない", () => {
    const imports = importLines().join("\n");
    assert.doesNotMatch(imports, /PostValidAnswers|PostVariables|PostAnswers/);
  });

  test("questions.ts・actions.ts・contactsの選択ロジックをimportしていない", () => {
    const imports = importLines().join("\n");
    assert.doesNotMatch(imports, /from "\.\.\/questions"|from "\.\.\/actions"|from "\.\.\/contacts"/);
  });

  test("UI（DiagnosisResultSections）をimportしていない", () => {
    const imports = importLines().join("\n");
    assert.doesNotMatch(imports, /DiagnosisResultSections/);
  });

  test("importは4件のみ（types／reasons／registryの3ファイル＋KNOWLEDGE_CARD_ORDER再import無し）", () => {
    assert.equal(importLines().length, 4);
  });
});
