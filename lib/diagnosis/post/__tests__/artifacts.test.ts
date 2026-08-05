import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computePostVariables } from "../variables";
import { buildConfirmedFacts } from "../artifacts/buildConfirmedFacts";
import { buildUnknownItems } from "../artifacts/buildUnknownItems";
import { C7_FACT, H1_FACT, CT1_FACT } from "../artifacts/factPhrases";
import type { PostValidAnswers } from "../types";

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

function build(overrides: Partial<PostValidAnswers>) {
  const a = answers(overrides);
  const v = computePostVariables(a);
  return { confirmedFacts: buildConfirmedFacts(a, v), unknownItems: buildUnknownItems(v) };
}

function ids(items: { id: string }[]): string[] {
  return items.map((i) => i.id);
}

describe("buildConfirmedFacts / buildUnknownItems: literalなunknownの排他分類", () => {
  test("c4がunknownならconfirmedFactsに出ず、unknownItemsに出る", () => {
    const { confirmedFacts, unknownItems } = build({ c4: "unknown" });
    assert.ok(!ids(confirmedFacts).includes("fact_c4_support"));
    assert.ok(ids(unknownItems).includes("unknown_c4_support"));
  });

  test("c4がnot_arrangedならconfirmedFactsに出て、unknownItemsに出ない", () => {
    const { confirmedFacts, unknownItems } = build({ c4: "not_arranged" });
    const fact = confirmedFacts.find((f) => f.id === "fact_c4_support");
    assert.ok(fact);
    assert.equal(fact?.text, "医療・介護・生活支援は、まだ決まっていません。");
    assert.ok(!ids(unknownItems).includes("unknown_c4_support"));
  });

  test("h1がundecidedならconfirmedFactsに指定文言で出て、unknownItemsにはH1由来の項目が一切無い", () => {
    const { confirmedFacts, unknownItems } = build({ c6: "will_be_vacant", h1: "undecided" });
    const fact = confirmedFacts.find((f) => f.id === "fact_h1_home_intent");
    assert.equal(fact?.text, "ご本人の家を今後どうするかは、まだ決めていません。");
    assert.ok(!unknownItems.some((i) => i.dedupeGroup === "h1_home_intent"));
  });

  test("ct1がnot_confirmedならconfirmedFactsに出て、unknownItemsに出ない", () => {
    const { confirmedFacts, unknownItems } = build({ c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "not_confirmed" });
    const fact = confirmedFacts.find((f) => f.id === "fact_ct1_contract");
    assert.equal(fact?.text, "ご本人が説明をどの程度理解し、考えを伝えられているかは、まだ確認していないとの回答です。");
    assert.ok(!ids(unknownItems).includes("unknown_ct1_contract"));
  });

  test("ct1がunknownならconfirmedFactsに出ず、unknownItemsに出る", () => {
    const { confirmedFacts, unknownItems } = build({ c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "unknown" });
    assert.ok(!ids(confirmedFacts).includes("fact_ct1_contract"));
    assert.ok(ids(unknownItems).includes("unknown_ct1_contract"));
  });

  test("回答済み項目（h2がsole_owner）はunknownItemsへ出ない", () => {
    const { unknownItems } = build({ c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "clearly_understands" });
    assert.ok(!ids(unknownItems).includes("unknown_h2_ownership"));
  });

  test("c6がunknownならunknown_c6_home_statusが表示される", () => {
    const { unknownItems } = build({ c6: "unknown" });
    assert.ok(ids(unknownItems).includes("unknown_c6_home_status"));
  });
});

describe("buildConfirmedFacts: 費用不明・注意回答の優先度", () => {
  test("費用不明（C7）は支援調整済み（C4）より優先される", () => {
    const { confirmedFacts } = build({ c4: "arranged", c7: "unknown_amount" });
    const c7Index = confirmedFacts.findIndex((f) => f.id === "fact_c7_money");
    const c4Index = confirmedFacts.findIndex((f) => f.id === "fact_c4_support");
    assert.ok(c7Index !== -1);
    assert.ok(c4Index !== -1);
    assert.ok(c7Index < c4Index);
  });

  test("H1のsell（注意回答）はkeep_for_now（安定回答）より優先度が高い", () => {
    const sell = buildConfirmedFacts(answers({ c6: "will_be_vacant", h1: "sell" }), computePostVariables(answers({ c6: "will_be_vacant", h1: "sell" })));
    const keep = buildConfirmedFacts(
      answers({ c6: "will_be_vacant", h1: "keep_for_now" }),
      computePostVariables(answers({ c6: "will_be_vacant", h1: "keep_for_now" })),
    );
    const sellFact = sell.find((f) => f.id === "fact_h1_home_intent");
    const keepFact = keep.find((f) => f.id === "fact_h1_home_intent");
    assert.ok(sellFact && keepFact);
    assert.ok((sellFact?.priority ?? 999) < (keepFact?.priority ?? -1));
  });

  test("CT1のseems_difficult（注意回答）はclearly_understands（安定回答）より優先度が高い", () => {
    // 他の候補を"unknown"で除外し、5件上限で削られないようにする
    const shared: Partial<PostValidAnswers> = {
      c2: "unknown",
      c4: "unknown",
      c5: "unknown",
      c7: "unknown",
      c6: "will_be_vacant",
      h1: "sell",
      h2: "sole_owner",
    };
    const difficult = build({ ...shared, ct1: "seems_difficult" });
    const clear = build({ ...shared, ct1: "clearly_understands" });
    const difficultFact = difficult.confirmedFacts.find((f) => f.id === "fact_ct1_contract");
    const clearFact = clear.confirmedFacts.find((f) => f.id === "fact_ct1_contract");
    assert.ok(difficultFact && clearFact);
    assert.ok((difficultFact?.priority ?? 999) < (clearFact?.priority ?? -1));
  });
});

describe("buildConfirmedFacts: tie-break・dedupe・上限", () => {
  test("同一priority（within_7_daysとurgent_after_dischargeは共に10）でもソースはC2→C3の順で決定論的", () => {
    // C2とC7の within_7_days(10) / unknown_amount(10) が同時に成立するケースで、C2が先に来る
    const { confirmedFacts } = build({ c1: "hospitalized", c2: "within_7_days", c7: "unknown_amount" });
    const c2Index = confirmedFacts.findIndex((f) => f.id === "fact_c2_deadline");
    const c7Index = confirmedFacts.findIndex((f) => f.id === "fact_c7_money");
    assert.ok(c2Index !== -1 && c7Index !== -1);
    assert.ok(c2Index < c7Index);
  });

  test("dedupeGroup後、confirmedFactsは最大5件を超えない", () => {
    const { confirmedFacts } = build({ c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "not_confirmed" });
    assert.ok(confirmedFacts.length <= 5);
  });

  test("unknownItemsは最大6件を超えない", () => {
    const { unknownItems } = build({
      c2: "unknown",
      c4: "unknown",
      c5: "unknown",
      c6: "unknown",
      c7: "unknown",
    });
    assert.ok(unknownItems.length <= 6);
  });
});

describe("buildConfirmedFacts / buildUnknownItems: 決定論性", () => {
  test("同じ入力なら同じID・文章・順序が返る", () => {
    const a = answers({ c6: "will_be_vacant", h1: "sell", h2: "unknown", ct1: "not_confirmed" });
    const v = computePostVariables(a);
    const first = { confirmedFacts: buildConfirmedFacts(a, v), unknownItems: buildUnknownItems(v) };
    const second = { confirmedFacts: buildConfirmedFacts(a, v), unknownItems: buildUnknownItems(v) };
    assert.deepEqual(first, second);
  });
});

describe("到達可能な3シナリオ", () => {
  test("シナリオ1: 低情報状態", () => {
    const { confirmedFacts, unknownItems } = build({
      c1: "hospitalized",
      c2: "unknown",
      c3: "undecided",
      c4: "unknown",
      c5: "unknown",
      c6: "unknown",
      c7: "unknown",
      c8: "unknown",
    });
    assert.deepEqual(ids(confirmedFacts), ["fact_c3_residence"]);
    assert.deepEqual(ids(unknownItems), [
      "unknown_c2_deadline",
      "unknown_c4_support",
      "unknown_c5_wishes",
      "unknown_c7_money",
      "unknown_c6_home_status",
    ]);
  });

  test("シナリオ2: 支援枝到達", () => {
    const { confirmedFacts, unknownItems } = build({
      c1: "discharged",
      c2: "some_unresolved",
      c3: "return_home",
      c4: "not_arranged",
      c5: "wants_home",
      c6: "no_home_issue",
      c7: "likely_sufficient",
      c8: "few_supporters",
      s1: "unknown",
    });
    assert.deepEqual(ids(confirmedFacts), [
      "fact_c4_support",
      "fact_c2_deadline",
      "fact_c3_residence",
      "fact_c6_home_status",
      "fact_c5_wishes",
    ]);
    assert.ok(!ids(confirmedFacts).includes("fact_c7_money"));
    assert.deepEqual(ids(unknownItems), ["unknown_s1_care"]);
  });

  test("シナリオ3: 実家売却枝到達", () => {
    const { confirmedFacts, unknownItems } = build({
      c1: "facility_search",
      c2: "date_unknown",
      c3: "facility",
      c4: "arranged",
      c5: "considering",
      c6: "will_be_vacant",
      c7: "unknown_amount",
      c8: "shared",
      h1: "sell",
      h2: "unknown",
      ct1: "not_confirmed",
    });
    assert.deepEqual(ids(confirmedFacts), [
      "fact_c7_money",
      "fact_c2_deadline",
      "fact_h1_home_intent",
      "fact_c5_wishes",
      "fact_ct1_contract",
    ]);
    assert.ok(!ids(confirmedFacts).includes("fact_c3_residence"));
    assert.ok(!ids(confirmedFacts).includes("fact_c4_support"));
    assert.ok(!ids(confirmedFacts).includes("fact_c6_home_status"));
    assert.deepEqual(ids(unknownItems), ["unknown_h2_ownership"]);
  });

  test("3シナリオともconfirmedFactsとunknownItemsのdedupeGroupが重複しない", () => {
    const scenarios: Partial<PostValidAnswers>[] = [
      { c1: "hospitalized", c2: "unknown", c3: "undecided", c4: "unknown", c5: "unknown", c6: "unknown", c7: "unknown", c8: "unknown" },
      {
        c1: "discharged",
        c2: "some_unresolved",
        c3: "return_home",
        c4: "not_arranged",
        c5: "wants_home",
        c6: "no_home_issue",
        c7: "likely_sufficient",
        c8: "few_supporters",
        s1: "unknown",
      },
      {
        c1: "facility_search",
        c2: "date_unknown",
        c3: "facility",
        c4: "arranged",
        c5: "considering",
        c6: "will_be_vacant",
        c7: "unknown_amount",
        c8: "shared",
        h1: "sell",
        h2: "unknown",
        ct1: "not_confirmed",
      },
    ];
    for (const overrides of scenarios) {
      const { confirmedFacts, unknownItems } = build(overrides);
      const confirmedGroups = new Set(confirmedFacts.map((f) => f.dedupeGroup));
      const unknownGroups = new Set(unknownItems.map((f) => f.dedupeGroup));
      const overlap = [...confirmedGroups].filter((g) => unknownGroups.has(g));
      assert.deepEqual(overlap, []);
    }
  });
});

describe("固定変換表: artifactPriorityの直接検証（数値が小さいほど優先度が高い）", () => {
  test("CT1: seems_difficultとnot_confirmedはclearly_understandsより優先度が高い", () => {
    assert.ok(CT1_FACT.seems_difficult.artifactPriority < CT1_FACT.clearly_understands.artifactPriority);
    assert.ok(CT1_FACT.not_confirmed.artifactPriority < CT1_FACT.clearly_understands.artifactPriority);
  });

  test("CT1: fluctuatesもclearly_understandsより優先度が高い（注意回答は一律で安定回答より優先）", () => {
    assert.ok(CT1_FACT.fluctuates.artifactPriority < CT1_FACT.clearly_understands.artifactPriority);
  });

  test("H1: sell/rent/demolish/undecidedはkeep_for_nowより優先度が高い", () => {
    assert.ok(H1_FACT.sell.artifactPriority < H1_FACT.keep_for_now.artifactPriority);
    assert.ok(H1_FACT.rent.artifactPriority < H1_FACT.keep_for_now.artifactPriority);
    assert.ok(H1_FACT.demolish.artifactPriority < H1_FACT.keep_for_now.artifactPriority);
    assert.ok(H1_FACT.undecided.artifactPriority < H1_FACT.keep_for_now.artifactPriority);
  });

  test("C7: unknown_amountはlikely_sufficientより優先度が高い", () => {
    assert.ok(C7_FACT.unknown_amount.artifactPriority < C7_FACT.likely_sufficient.artifactPriority);
  });
});

describe("buildUnknownItems: 全候補が行動指示ではなく状態文であること", () => {
  const scenarios: Array<[string, Partial<PostValidAnswers>]> = [
    ["c2", { c2: "unknown" }],
    ["c4", { c4: "unknown" }],
    ["c5", { c5: "unknown" }],
    ["c7", { c7: "unknown" }],
    ["s1", { c4: "not_arranged", s1: "unknown" }],
    ["c6", { c6: "unknown" }],
    ["h2", { c6: "will_be_vacant", h1: "sell", h2: "unknown" }],
    ["ct1", { c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "unknown" }],
  ];

  for (const [label, overrides] of scenarios) {
    test(`${label}由来の未確認事項が「まだ確認できていません。」で終わり、行動指示を含まない`, () => {
      const { unknownItems } = build(overrides);
      assert.ok(unknownItems.length > 0);
      for (const item of unknownItems) {
        assert.ok(item.text.endsWith("まだ確認できていません。"), `${item.id}: ${item.text}`);
        assert.doesNotMatch(item.text, /しましょう|へ確認/);
      }
    });
  }
});
