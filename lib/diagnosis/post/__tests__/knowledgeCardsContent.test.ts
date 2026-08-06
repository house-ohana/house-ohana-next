import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  KNOWLEDGE_CARD_CONTENTS,
  DISCHARGE_SUPPORT_START_GAP,
  TRANSITION_MONTHLY_CASH_GAP,
  HOME_OWNERSHIP_INTENT_GAP,
} from "../knowledgeCards/content";
import { KNOWLEDGE_CARD_REGISTRY } from "../knowledgeCards/registry";
import { isContentReadyToEnable } from "../knowledgeCards/contentVerification";
import { CONTACT_CARDS } from "../guidanceContent";
import type { KnowledgeCardContent } from "../knowledgeCards/types";

// このテストファイルは Phase4.1 Step1（型・固定content・reasons・registry）のみを対象とする。
// matcher・selector・PostResult接続・UIはまだ実装していないため、それらのテストは含まない。

describe("knowledgeCards content: 3カードの基本要件", () => {
  test("3カードだけが存在する", () => {
    assert.equal(KNOWLEDGE_CARD_CONTENTS.length, 3);
  });

  test("IDが一意", () => {
    const ids = KNOWLEDGE_CARD_CONTENTS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  for (const content of KNOWLEDGE_CARD_CONTENTS) {
    test(`${content.id}: titleが空でない`, () => {
      assert.ok(content.title.length > 0);
    });
    test(`${content.id}: cliffが空でない`, () => {
      assert.ok(content.cliff.length > 0);
    });
    test(`${content.id}: checkItemsが1件以上`, () => {
      assert.ok(content.checkItems.length >= 1);
    });
    test(`${content.id}: linkedContactIdsが空でない`, () => {
      assert.ok(content.linkedContactIds.length >= 1);
    });
  }

  test("linkedContactIdsが現行のguidanceContent.CONTACT_CARDSに実在するIDである", () => {
    const validIds = new Set(Object.values(CONTACT_CARDS).map((c) => c.id));
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      for (const id of content.linkedContactIds) {
        assert.ok(validIds.has(id), `${content.id}: "${id}" は CONTACT_CARDS に存在しない`);
      }
    }
  });

  test("KnowledgeCardContentがenabledを持たない", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      assert.ok(!Object.prototype.hasOwnProperty.call(content, "enabled"));
    }
  });

  test("Card Bのタイトルが確定文言と一致する", () => {
    assert.equal(TRANSITION_MONTHLY_CASH_GAP.title, "費用の総額だけでは、家族が負担する時期までは分かりません");
  });

  test("Card Bのcliffに断定表現が無い", () => {
    assert.doesNotMatch(TRANSITION_MONTHLY_CASH_GAP.cliff, /必ず不足|必ず立替え|絶対に/);
  });

  test("Card CのlinkedContactIdsがlegalだけである", () => {
    assert.deepEqual(HOME_OWNERSHIP_INTENT_GAP.linkedContactIds, ["legal"]);
  });

  test("Card Cにreal_estateが含まれない", () => {
    assert.ok(!HOME_OWNERSHIP_INTENT_GAP.linkedContactIds.includes("real_estate" as never));
  });

  test("Card Aのlinked先はhospital/regional_support/care_manager", () => {
    assert.deepEqual(DISCHARGE_SUPPORT_START_GAP.linkedContactIds, ["hospital", "regional_support", "care_manager"]);
  });
});

describe("knowledgeCards registry: enabledの分離", () => {
  test("registryが3件を含む", () => {
    assert.equal(KNOWLEDGE_CARD_REGISTRY.length, 3);
  });

  test("registry側にenabledが存在する", () => {
    for (const entry of KNOWLEDGE_CARD_REGISTRY) {
      assert.equal(typeof entry.enabled, "boolean");
    }
  });

  test("3カードすべてenabled=false", () => {
    for (const entry of KNOWLEDGE_CARD_REGISTRY) {
      assert.equal(entry.enabled, false);
    }
  });

  test("registryのcontentがcontent.tsの定数と同一参照である（複製されていない）", () => {
    assert.equal(KNOWLEDGE_CARD_REGISTRY[0]?.content, DISCHARGE_SUPPORT_START_GAP);
    assert.equal(KNOWLEDGE_CARD_REGISTRY[1]?.content, TRANSITION_MONTHLY_CASH_GAP);
    assert.equal(KNOWLEDGE_CARD_REGISTRY[2]?.content, HOME_OWNERSHIP_INTENT_GAP);
  });

  test("registryのID集合がKNOWLEDGE_CARD_CONTENTSと一致する", () => {
    const registryIds = KNOWLEDGE_CARD_REGISTRY.map((e) => e.content.id).sort();
    const contentIds = KNOWLEDGE_CARD_CONTENTS.map((c) => c.id).sort();
    assert.deepEqual(registryIds, contentIds);
  });
});

describe("knowledgeCards: 出典未確認状態の表現と検証関数", () => {
  test("Step1の全カードは出典未確認状態（sources: [] / verifiedAt: null / reviewBy: null）", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      assert.deepEqual(content.sources, []);
      assert.equal(content.verifiedAt, null);
      assert.equal(content.reviewBy, null);
    }
  });

  test("disabledカード（未確認状態）はisContentReadyToEnableでfalseになる", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      assert.equal(isContentReadyToEnable(content), false);
    }
  });

  test("isContentReadyToEnable: sources・verifiedAt・reviewByが揃っていればtrue", () => {
    const ready: KnowledgeCardContent = {
      ...DISCHARGE_SUPPORT_START_GAP,
      sources: [{ title: "出典タイトル", organization: "公的機関", url: "https://example.jp/doc", accessedAt: "2026-01-01" }],
      verifiedAt: "2026-01-01",
      reviewBy: "2026-07-01",
    };
    assert.equal(isContentReadyToEnable(ready), true);
  });

  test("isContentReadyToEnable: sourcesが空ならfalse", () => {
    const notReady: KnowledgeCardContent = { ...DISCHARGE_SUPPORT_START_GAP, verifiedAt: "2026-01-01", reviewBy: "2026-07-01" };
    assert.equal(isContentReadyToEnable(notReady), false);
  });

  test("isContentReadyToEnable: verifiedAtが不正な日付文字列ならfalse", () => {
    const notReady: KnowledgeCardContent = {
      ...DISCHARGE_SUPPORT_START_GAP,
      sources: [{ title: "t", organization: "o", url: "https://example.jp", accessedAt: "2026-01-01" }],
      verifiedAt: "not-a-date",
      reviewBy: "2026-07-01",
    };
    assert.equal(isContentReadyToEnable(notReady), false);
  });

  test("isContentReadyToEnable: reviewByがnullならfalse", () => {
    const notReady: KnowledgeCardContent = {
      ...DISCHARGE_SUPPORT_START_GAP,
      sources: [{ title: "t", organization: "o", url: "https://example.jp", accessedAt: "2026-01-01" }],
      verifiedAt: "2026-01-01",
      reviewBy: null,
    };
    assert.equal(isContentReadyToEnable(notReady), false);
  });
});
