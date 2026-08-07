import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getWhyNow } from "../knowledgeCards/reasons";
import type { KnowledgeReasonId } from "../knowledgeCards/types";

// このテストファイルは Phase4.1 Step1のreasons（KnowledgeReasonId→whyNow固定変換）のみを
// 対象とする。matcher・selector・PostResult接続・UIはまだ実装していない。

const ALL_REASON_IDS: KnowledgeReasonId[] = [
  "discharge_support_not_arranged",
  "discharge_support_partly_arranged",
  "discharge_residence_undecided",
  "discharge_support_and_residence_gap",
  "money_family_contribution",
  "money_family_contribution_and_unclear",
  "money_family_contribution_urgent",
  "home_ownership_unclear",
  "home_intent_unconfirmed",
  "home_contract_concern",
  "home_ownership_and_intent_unclear",
];

describe("knowledgeCards reasons: whyNow固定変換", () => {
  test("reasonIdは11件である", () => {
    assert.equal(ALL_REASON_IDS.length, 11);
  });

  test("11件すべてのreasonIdにwhyNowが存在し、空でない", () => {
    for (const id of ALL_REASON_IDS) {
      const text = getWhyNow(id);
      assert.equal(typeof text, "string");
      assert.ok(text.length > 0, id);
    }
  });

  test("不安を煽る断定表現が無い", () => {
    for (const id of ALL_REASON_IDS) {
      assert.doesNotMatch(getWhyNow(id), /危険|必ず困る|絶対に|手遅れ|取り返しがつかない/);
    }
  });

  test("同じreasonIdなら常に同じwhyNowを返す（決定論性）", () => {
    for (const id of ALL_REASON_IDS) {
      assert.equal(getWhyNow(id), getWhyNow(id));
    }
  });

  test("Card Bのurgent文言が確定文言（コピーレビュー承認後）と一致する", () => {
    assert.equal(
      getWhyNow("money_family_contribution_urgent"),
      "今後の生活にかかる費用を確認する必要があるため、支払いがかさなる時期や、家族による費用負担がいつ必要になるかを早めに整理しておきましょう。",
    );
  });

  test("代表的なreasonIdの文言が確定文言（コピーレビュー承認後）と一致する", () => {
    assert.equal(
      getWhyNow("discharge_support_not_arranged"),
      "退院後の生活サポートがまだ決まっていないため、必要なサポートがいつから始まるか確認する必要があります。",
    );
    assert.equal(
      getWhyNow("discharge_support_and_residence_gap"),
      "退院後の住まいがまだ決まっておらず、生活サポートにも確認が必要な点が残っているため、退院後の生活に向けて、必要な準備を整理しておく必要があります。",
    );
    assert.equal(
      getWhyNow("money_family_contribution_and_unclear"),
      "今後の生活にかかる費用がまだ整理できていないため、支払いがかさなる時期と、家族による費用負担がいつ必要になるかをあわせて確認する必要があります。",
    );
    assert.equal(
      getWhyNow("home_contract_concern"),
      "契約に関して気になる点があるため、申込みや署名などを進める前に、内容を専門家へ確認する必要があります。",
    );
    assert.equal(
      getWhyNow("home_ownership_and_intent_unclear"),
      "家の名義と本人の意向の両方が確認できていないため、家のことを具体的に進める前に確認する必要があります。",
    );
  });

  test("reasons.tsがAnswers系・Variables系の型をimportしていない", () => {
    const source = readFileSync(fileURLToPath(new URL("../knowledgeCards/reasons.ts", import.meta.url)), "utf-8");
    assert.doesNotMatch(source, /PostValidAnswers|PostVariables|PostAnswers/);
  });
});
