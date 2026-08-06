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

  test("Card Bのタイトルが確定文言（レビュー承認後）と一致する", () => {
    assert.equal(
      TRANSITION_MONTHLY_CASH_GAP.title,
      "家族が費用を負担する可能性がある場合でも、総額だけでは、負担する時期までは分かりません",
    );
  });

  test("Card Bのタイトルに旧文言が残っていない", () => {
    assert.notEqual(TRANSITION_MONTHLY_CASH_GAP.title, "費用の総額だけでは、家族が負担する時期までは分かりません");
  });

  test("Card Bのcliffは変更されていない", () => {
    assert.equal(
      TRANSITION_MONTHLY_CASH_GAP.cliff,
      "家族が費用を負担する可能性がある場合でも、総額だけでは、支払いが重なる月や家族の立替えが始まる時期までは分かりません。今後3か月を月ごとに分けて確認します。",
    );
  });

  test("Card Bのcliffに断定表現が無い", () => {
    assert.doesNotMatch(TRANSITION_MONTHLY_CASH_GAP.cliff, /必ず不足|必ず立替え|絶対に/);
  });

  test("Card BのcheckItemsは変更されていない", () => {
    assert.deepEqual(TRANSITION_MONTHLY_CASH_GAP.checkItems, [
      "毎月入るお金",
      "毎月続く支出",
      "その月だけ発生する支出",
      "家族が支払う予定の費用と開始月",
    ]);
  });

  test("Card BのlinkedContactIdsはfpのままである", () => {
    assert.deepEqual(TRANSITION_MONTHLY_CASH_GAP.linkedContactIds, ["fp"]);
  });

  test("Card Aのtitleは変更されていない", () => {
    assert.equal(DISCHARGE_SUPPORT_START_GAP.title, "退院後の支援は、退院日と同じ日に始まるとは限りません");
  });

  test("Card Cのtitleは変更されていない", () => {
    assert.equal(HOME_OWNERSHIP_INTENT_GAP.title, "家の方針が決まっても、名義と本人の意向が揃っているとは限りません");
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

  test("Card AだけenabledTrue、Card B・Cはenabled=false（2026-08-06 Card A有効化後の正式状態）", () => {
    const byId = new Map(KNOWLEDGE_CARD_REGISTRY.map((entry) => [entry.content.id, entry.enabled] as const));
    assert.equal(byId.get("discharge_support_start_gap"), true);
    assert.equal(byId.get("transition_monthly_cash_gap"), false);
    assert.equal(byId.get("home_ownership_intent_gap"), false);
  });

  test("registryの順番はA・B・Cのまま", () => {
    assert.deepEqual(
      KNOWLEDGE_CARD_REGISTRY.map((entry) => entry.content.id),
      ["discharge_support_start_gap", "transition_monthly_cash_gap", "home_ownership_intent_gap"],
    );
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

// 2026-08-06レビュー（docs/reviews/phase4.1-knowledge-card-source-review.md）で採用された
// 出典。並び順（A1→A2、B1→B2→B3、C1→C2→C3）もレビュー文書の採用順に合わせている。
const EXPECTED_SOURCES_A = [
  {
    title: "疾病・事業及び在宅医療に係る医療体制について",
    organization: "厚生労働省",
    url: "https://www.mhlw.go.jp/web/t_doc?dataId=00tc7580&dataType=1&pageNo=7",
    accessedAt: "2026-08-06",
  },
  {
    title: "令和7年度地域の在宅医療の体制整備に向けた調査・連携支援事業",
    organization: "厚生労働省",
    url: "https://www.mhlw.go.jp/stf/newpage_72086.html",
    accessedAt: "2026-08-06",
  },
];

const EXPECTED_SOURCES_B = [
  {
    title: "サービスにかかる利用料",
    organization: "厚生労働省（介護サービス情報公表システム）",
    url: "https://www.kaigokensaku.mhlw.go.jp/commentary/fee.html",
    accessedAt: "2026-08-06",
  },
  {
    title: "介護サービスにかかる概算の料金を知りたい",
    organization: "厚生労働省（介護サービス情報公表システム）",
    url: "https://www.kaigokensaku.mhlw.go.jp/help/page6.html",
    accessedAt: "2026-08-06",
  },
  {
    title: "ライフプランシミュレーター",
    organization: "金融庁",
    url: "https://www.fsa.go.jp/policy/nisa2/lifeplan-simulator/",
    accessedAt: "2026-08-06",
  },
];

const EXPECTED_SOURCES_C = [
  {
    title: "不動産登記のABC",
    organization: "法務省",
    url: "https://www.moj.go.jp/MINJI/minji02",
    accessedAt: "2026-08-06",
  },
  {
    title: "登記の申請を御検討されている皆さまへ",
    organization: "法務局",
    url: "https://houmukyoku.moj.go.jp/homu/page_000001_00051.html",
    accessedAt: "2026-08-06",
  },
  {
    title: "COLUMN 高齢者の認知機能障害に応じた消費者トラブルと対応策の検討に関する研究（令和5年版消費者白書）",
    organization: "消費者庁",
    url: "https://www.caa.go.jp/policies/policy/consumer_research/white_paper/2023/white_paper_column_03.html",
    accessedAt: "2026-08-06",
  },
];

const PUBLIC_DOMAINS = [
  "www.mhlw.go.jp",
  "www.kaigokensaku.mhlw.go.jp",
  "www.fsa.go.jp",
  "www.moj.go.jp",
  "houmukyoku.moj.go.jp",
  "www.caa.go.jp",
];

const YMD = /^\d{4}-\d{2}-\d{2}$/;

describe("knowledgeCards: 出典登録（2026-08-06レビュー反映後）", () => {
  test("Card Aのsourcesは2件で、レビュー文書採用のA1→A2の順で一致する", () => {
    assert.deepEqual(DISCHARGE_SUPPORT_START_GAP.sources, EXPECTED_SOURCES_A);
  });

  test("Card Bのsourcesは3件で、レビュー文書採用のB1→B2→B3の順で一致する", () => {
    assert.deepEqual(TRANSITION_MONTHLY_CASH_GAP.sources, EXPECTED_SOURCES_B);
  });

  test("Card Cのsourcesは3件で、レビュー文書採用のC1→C2→C3の順で一致する", () => {
    assert.deepEqual(HOME_OWNERSHIP_INTENT_GAP.sources, EXPECTED_SOURCES_C);
  });

  test("全カード合計で8件のsourcesが登録されている", () => {
    const total = KNOWLEDGE_CARD_CONTENTS.reduce((sum, c) => sum + c.sources.length, 0);
    assert.equal(total, 8);
  });

  test("同一カード内にURLの重複が無い", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      const urls = content.sources.map((s) => s.url);
      assert.equal(new Set(urls).size, urls.length, `${content.id}: URL重複`);
    }
  });

  test("全sourceのurlがhttpsで始まる", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      for (const source of content.sources) {
        assert.ok(source.url.startsWith("https://"), `${content.id}: ${source.url}`);
      }
    }
  });

  test("全sourceのurlが公的機関ドメインである", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      for (const source of content.sources) {
        const host = new URL(source.url).host;
        assert.ok(PUBLIC_DOMAINS.includes(host), `${content.id}: 未知のドメイン ${host}`);
      }
    }
  });

  test("sourcesに追跡パラメータ（utm_・referral等）が含まれない", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      for (const source of content.sources) {
        assert.doesNotMatch(source.url, /[?&](utm_|ref=|referral)/i, `${content.id}: ${source.url}`);
      }
    }
  });

  test("Card Cに成年後見制度ページ（C4）のURLが含まれない", () => {
    const urls = HOME_OWNERSHIP_INTENT_GAP.sources.map((s) => s.url);
    assert.ok(!urls.includes("https://www.moj.go.jp/MINJI/a01.html"));
  });

  test("いずれのcontentにも成年後見制度ページのURLが含まれない", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      const urls = content.sources.map((s) => s.url);
      assert.ok(!urls.includes("https://www.moj.go.jp/MINJI/a01.html"), `${content.id}`);
    }
  });

  test("空文字列・PENDING・TBDがsources/verifiedAt/reviewByに含まれない", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      assert.notEqual(content.verifiedAt, "");
      assert.notEqual(content.reviewBy, "");
      assert.doesNotMatch(content.verifiedAt ?? "", /PENDING|TBD/i);
      assert.doesNotMatch(content.reviewBy ?? "", /PENDING|TBD/i);
      for (const source of content.sources) {
        assert.notEqual(source.organization, "");
        assert.notEqual(source.title, "");
        assert.notEqual(source.url, "");
        assert.notEqual(source.accessedAt, "");
        assert.doesNotMatch(`${source.organization}${source.title}${source.url}`, /PENDING|TBD/i);
      }
    }
  });
});

describe("knowledgeCards: verifiedAt・reviewByの日付", () => {
  test("全カードのverifiedAtが実レビュー日（2026-08-06）と一致する", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      assert.equal(content.verifiedAt, "2026-08-06");
    }
  });

  test("全カードのreviewByがverifiedAtの6か月後（2027-02-06）と一致する", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      assert.equal(content.reviewBy, "2027-02-06");
    }
  });

  test("verifiedAt・reviewByがYYYY-MM-DD形式である（時刻・タイムゾーンを含まない）", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      assert.match(content.verifiedAt ?? "", YMD);
      assert.match(content.reviewBy ?? "", YMD);
    }
  });

  test("全sourceのaccessedAtがYYYY-MM-DD形式で2026-08-06と一致する", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      for (const source of content.sources) {
        assert.match(source.accessedAt, YMD);
        assert.equal(source.accessedAt, "2026-08-06");
      }
    }
  });
});

describe("knowledgeCards: readinessとregistryの分離", () => {
  test("3カードすべてisContentReadyToEnableがtrueになる", () => {
    for (const content of KNOWLEDGE_CARD_CONTENTS) {
      assert.equal(isContentReadyToEnable(content), true, `${content.id}`);
    }
  });

  test("readyとenabledは独立した状態であり、3カードともready=trueだがenabledはCard Aだけtrue", () => {
    // content.tsの出典登録（ready）とregistry.tsのenabledは独立している（docs/03 第4章）。
    // 2026-08-06時点の正式状態: 3カードともready=true。Card Aだけenabled=true、Card B・Cはfalse。
    const state = KNOWLEDGE_CARD_REGISTRY.map((entry) => ({
      id: entry.content.id,
      ready: isContentReadyToEnable(entry.content),
      enabled: entry.enabled,
    }));
    assert.deepEqual(state, [
      { id: "discharge_support_start_gap", ready: true, enabled: true },
      { id: "transition_monthly_cash_gap", ready: true, enabled: false },
      { id: "home_ownership_intent_gap", ready: true, enabled: false },
    ]);
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
    const notReady: KnowledgeCardContent = {
      ...DISCHARGE_SUPPORT_START_GAP,
      sources: [],
      verifiedAt: "2026-01-01",
      reviewBy: "2026-07-01",
    };
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
